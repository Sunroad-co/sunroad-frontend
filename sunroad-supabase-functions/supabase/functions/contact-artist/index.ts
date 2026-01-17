/* eslint-disable no-console */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// -----------------------------
// Env
// -----------------------------
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TURNSTILE_SECRET_KEY = Deno.env.get("TURNSTILE_SECRET_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const CONTACT_FROM_EMAIL =
  Deno.env.get("CONTACT_FROM_EMAIL") ?? "notifications@auth.sunroad.io";

// "pepper" for hashing identifiers (never store raw IP)
const IDENTIFIER_PEPPER = Deno.env.get("CONTACT_IDENTIFIER_PEPPER")!;

// rate limits
const MAX_PER_IP_24H = Number(Deno.env.get("CONTACT_MAX_PER_IP_24H") ?? "50");
const MAX_PER_EMAIL_24H = Number(Deno.env.get("CONTACT_MAX_PER_EMAIL_24H") ?? "25");
const MAX_PER_IP_ARTIST_24H = Number(Deno.env.get("CONTACT_MAX_PER_IP_ARTIST_24H") ?? "25");
const MAX_PER_EMAIL_ARTIST_24H = Number(Deno.env.get("CONTACT_MAX_PER_EMAIL_ARTIST_24H") ?? "25");

// -----------------------------
// Helpers
// -----------------------------
function getClientIp(req: Request): string | null {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf && cf.trim()) return cf.trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff && xff.trim()) return xff.split(",")[0].trim();
  return null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Secure Peppered Hash (keep pepper!)
async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(token: string, remoteip?: string | null) {
  const form = new FormData();
  form.append("secret", TURNSTILE_SECRET_KEY);
  form.append("response", token);
  if (remoteip) form.append("remoteip", remoteip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });

  if (!res.ok) return { ok: false, error: "turnstile_http_error" as const };

  const data = await res.json().catch(() => null);
  if (data?.success === true) return { ok: true };
  return { ok: false, error: "turnstile_failed" as const };
}

async function sendResendEmail(params: {
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Sun Road <${CONTACT_FROM_EMAIL}>`,
      to: [params.to],
      reply_to: params.replyTo,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: "resend_failed" as const, details: json };
  return { ok: true, id: (json as any)?.id as string | undefined };
}

// -----------------------------
// CORS Allowlist
// -----------------------------
const ALLOWED_ORIGINS = [
  "https://sunroad.io",
  "https://www.sunroad.io",
  "https://sunroad-frontend.vercel.app",
  // Add Vercel domain(s) here - e.g., "https://sunroad-frontend.vercel.app"
  // For local dev
  "http://localhost:3000",
  "http://localhost:3001",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : null;
  
  const headers: Record<string, string> = {
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  };
  
  if (allowedOrigin) {
    headers["access-control-allow-origin"] = allowedOrigin;
    headers["access-control-allow-credentials"] = "true";
  }
  
  return headers;
}

// -----------------------------
// HTML Sanitization
// -----------------------------
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripNewlines(text: string): string {
  return text.replace(/\r\n/g, "").replace(/\n/g, "").replace(/\r/g, "");
}

// Make text safe for email subject (not HTML-escaped, but safe for headers)
function makeTextSafeForSubject(text: string): string {
  return text
    .replace(/</g, " ")
    .replace(/>/g, " ")
    .replace(/&/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// -----------------------------
// Main
// -----------------------------
Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // CORS check for non-OPTIONS requests
  if (req.method !== "OPTIONS" && origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? null;

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const artistHandle = String(payload?.artist_handle ?? "").trim();
  const fromNameRaw = String(payload?.from_name ?? "").trim();
  const fromEmailRaw = String(payload?.from_email ?? "").trim();
  const subjectRaw = String(payload?.subject ?? "").trim();
  const messageRaw = String(payload?.message ?? "").trim();
  const turnstileToken = String(payload?.turnstile_token ?? "").trim();

  // Strip newlines from name and subject to prevent header injection
  const fromName = stripNewlines(fromNameRaw);
  const subject = stripNewlines(subjectRaw);
  // Keep message as-is for now (will trim before escaping for email)
  const message = messageRaw;

  // Quick validation
  if (!artistHandle || artistHandle.length > 64) {
    return new Response(JSON.stringify({ error: "invalid_artist" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  if (!fromName || fromName.length < 1 || fromName.length > 120) {
    return new Response(JSON.stringify({ error: "invalid_name" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  // Check for newlines in name (should be stripped, but double-check)
  if (fromName.includes("\n") || fromName.includes("\r")) {
    return new Response(JSON.stringify({ error: "invalid_name" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  if (!fromEmailRaw || !isValidEmail(fromEmailRaw) || fromEmailRaw.length > 320) {
    return new Response(JSON.stringify({ error: "invalid_email" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  if (!subject || subject.length < 1 || subject.length > 160) {
    return new Response(JSON.stringify({ error: "invalid_subject" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  // Check for newlines in subject (should be stripped, but double-check)
  if (subject.includes("\n") || subject.includes("\r")) {
    return new Response(JSON.stringify({ error: "invalid_subject" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  const messageTrimmed = message.trim();
  if (!messageTrimmed || messageTrimmed.length < 10) {
    return new Response(JSON.stringify({ error: "invalid_message" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  if (message.length > 4000) {
    return new Response(JSON.stringify({ error: "invalid_message" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  if (!turnstileToken) {
    return new Response(JSON.stringify({ error: "missing_captcha" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // Verify Captcha
  const turnstile = await verifyTurnstile(turnstileToken, ip);
  if (!turnstile.ok) {
    return new Response(JSON.stringify({ error: "captcha_failed" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // lookup artist by handle
  const { data: artist, error: artistErr } = await supabase
    .from("artists_min")
    .select("id, auth_user_id")
    .eq("handle", artistHandle)
    .maybeSingle();

  if (artistErr || !artist) {
    // do not reveal details
    return new Response(JSON.stringify({ error: "contact_unavailable" }), {
      status: 404,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const artistId = artist.id as string;
  const artistAuthUserId = artist.auth_user_id as string;

  // hashed identifiers (peppered)
  const fromEmailNorm = normalizeEmail(fromEmailRaw);
  const fromEmailHash = await sha256Hex(`${fromEmailNorm}${IDENTIFIER_PEPPER}`);
  const ipHash = ip ? await sha256Hex(`${ip}${IDENTIFIER_PEPPER}`) : null;

  // check blocklist (artist-specific or global)
  // Block by email
  const blockEmail = await supabase
    .from("contact_blocklist")
    .select("id")
    .eq("from_email_hash", fromEmailHash)
    .or(`artist_id.is.null,artist_id.eq.${artistId}`)
    .limit(1);

  if (blockEmail.data && blockEmail.data.length > 0) {
    await supabase.from("contact_messages").insert({
      artist_id: artistId,
      artist_auth_user_id: artistAuthUserId,
      from_name: fromName,
      from_email: fromEmailNorm,
      subject,
      message,
      ip_hash: ipHash,
      from_email_hash: fromEmailHash,
      user_agent: userAgent,
      turnstile_ok: true,
      status: "rejected",
      error_code: "blocked",
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // Block by IP
  if (ipHash) {
    const blockIp = await supabase
      .from("contact_blocklist")
      .select("id")
      .eq("ip_hash", ipHash)
      .or(`artist_id.is.null,artist_id.eq.${artistId}`)
      .limit(1);

    if (blockIp.data && blockIp.data.length > 0) {
      await supabase.from("contact_messages").insert({
        artist_id: artistId,
        artist_auth_user_id: artistAuthUserId,
        from_name: fromName,
        from_email: fromEmailNorm,
        subject,
        message,
        ip_hash: ipHash,
        from_email_hash: fromEmailHash,
        user_agent: userAgent,
        turnstile_ok: true,
        status: "rejected",
        error_code: "blocked",
      });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
  }

  // -----------------------------
  // ✅ UPDATED CONTACT GATING
  // Old: supabase.rpc("can_receive_contact", { p_auth_user_id })
  // New: supabase.rpc("get_effective_limits", { p_auth_user_id }) and read can_receive_contact
  // -----------------------------
  const { data: limits, error: limitsErr } = await supabase.rpc("get_effective_limits", {
    p_auth_user_id: artistAuthUserId,
  });

  const limitRow = Array.isArray(limits) ? limits[0] : limits;
  const canReceive = !limitsErr && limitRow?.can_receive_contact === true;

  if (!canReceive) {
    await supabase.from("contact_messages").insert({
      artist_id: artistId,
      artist_auth_user_id: artistAuthUserId,
      from_name: fromName,
      from_email: fromEmailNorm,
      subject,
      message,
      ip_hash: ipHash,
      from_email_hash: fromEmailHash,
      user_agent: userAgent,
      turnstile_ok: true,
      status: "rejected",
      error_code: "contact_unavailable",
    });

    // keep behavior: don't reveal details
    return new Response(JSON.stringify({ error: "contact_unavailable" }), {
      status: 404,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // rate limit counts (last 24h)
  // Only count statuses that should consume quota: 'accepted', 'sent', 'failed'
  // Exclude 'throttled' and 'rejected' from rate-limit counts
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // per email
  const emailCountRes = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("from_email_hash", fromEmailHash)
    .in("status", ["accepted", "sent", "failed"])
    .gte("created_at", sinceIso);

  const emailCount = emailCountRes.count ?? 0;

  // per email per artist
  const emailArtistCountRes = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("from_email_hash", fromEmailHash)
    .eq("artist_id", artistId)
    .in("status", ["accepted", "sent", "failed"])
    .gte("created_at", sinceIso);

  const emailArtistCount = emailArtistCountRes.count ?? 0;

  // per ip
  let ipCount = 0;
  let ipArtistCount = 0;

  if (ipHash) {
    const ipCountRes = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .in("status", ["accepted", "sent", "failed"])
      .gte("created_at", sinceIso);
    ipCount = ipCountRes.count ?? 0;

    const ipArtistCountRes = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("artist_id", artistId)
      .in("status", ["accepted", "sent", "failed"])
      .gte("created_at", sinceIso);
    ipArtistCount = ipArtistCountRes.count ?? 0;
  }

  const throttled =
    emailCount >= MAX_PER_EMAIL_24H ||
    emailArtistCount >= MAX_PER_EMAIL_ARTIST_24H ||
    (ipHash ? ipCount >= MAX_PER_IP_24H || ipArtistCount >= MAX_PER_IP_ARTIST_24H : false);

  if (throttled) {
    await supabase.from("contact_messages").insert({
      artist_id: artistId,
      artist_auth_user_id: artistAuthUserId,
      from_name: fromName,
      from_email: fromEmailNorm,
      subject,
      message,
      ip_hash: ipHash,
      from_email_hash: fromEmailHash,
      user_agent: userAgent,
      turnstile_ok: true,
      status: "throttled",
      error_code: "rate_limited",
    });

    // soft response (avoid telling attacker they're throttled)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // fetch artist email
  const userRes = await supabase.auth.admin.getUserById(artistAuthUserId);
  const artistEmail = userRes?.data?.user?.email ?? null;

  if (!artistEmail) {
    await supabase.from("contact_messages").insert({
      artist_id: artistId,
      artist_auth_user_id: artistAuthUserId,
      from_name: fromName,
      from_email: fromEmailNorm,
      subject,
      message,
      ip_hash: ipHash,
      from_email_hash: fromEmailHash,
      user_agent: userAgent,
      turnstile_ok: true,
      status: "failed",
      error_code: "artist_email_missing",
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // Insert first as accepted so we always have a row
  const { data: row, error: insErr } = await supabase
    .from("contact_messages")
    .insert({
      artist_id: artistId,
      artist_auth_user_id: artistAuthUserId,
      from_name: fromName,
      from_email: fromEmailNorm,
      subject,
      message,
      ip_hash: ipHash,
      from_email_hash: fromEmailHash,
      user_agent: userAgent,
      turnstile_ok: true,
      status: "accepted",
    })
    .select("id")
    .single();

  if (insErr || !row) {
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const msgId = row.id as string;

  // Trim message before escaping
  const messageTrimmedForEmail = message.trim();

  // Sanitize HTML for email body
  const safeName = escapeHtml(fromName);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(messageTrimmedForEmail);

  // Email subject: use text-safe name (not HTML-escaped)
  // Replace < > & with spaces to prevent header injection
  // Truncate to max 40 chars to avoid crazy-long subjects
  const safeNameForSubject = makeTextSafeForSubject(fromName);
  const truncatedName = safeNameForSubject && safeNameForSubject.length > 40
    ? safeNameForSubject.substring(0, 40).trim()
    : safeNameForSubject;
  const emailSubject = truncatedName
    ? `Sun Road: New message from ${truncatedName}`
    : `Sun Road: New message from ${fromEmailNorm}`;

  // Generate plain text version
  // Use sanitized fromName and subject (already stripped of newlines)
  // Strip null chars from message for text version
  const messageForText = messageTrimmedForEmail.replace(/\0/g, '');
  const text = `New message via Sun Road

From: ${fromName} <${fromEmailNorm}>
Subject: ${subject}
Profile: https://sunroad.io/artists/${artistHandle}

${messageForText}

---
Reply to this email to respond directly.
`;

  // Generate HTML version
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
  <div class="preheader">New message from ${safeName} via Sun Road.</div>
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background-color: #ffffff;">
              <img src="https://sunroad.io/assets/img/sunroad-logo.png" alt="Sun Road" width="120" style="display: block; margin: 0 auto; max-width: 120px; height: auto;">
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.3;">
                New message from ${safeName}
              </h1>
              <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.5;">
                Sent via Sun Road
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #374151;">
                    <strong style="color: #111827;">From:</strong> ${safeName} &lt;${fromEmailNorm}&gt;
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #374151;">
                    <strong style="color: #111827;">Subject:</strong> ${safeSubject}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #374151;">
                    <strong style="color: #111827;">Profile:</strong> <a href="https://sunroad.io/artists/${artistHandle}" style="color: #d97706; text-decoration: none;">https://sunroad.io/artists/${artistHandle}</a>
                  </td>
                </tr>
              </table>
              <pre style="margin: 0; white-space: pre-wrap; border: 1px solid #e5e7eb; padding: 16px; border-radius: 6px; background-color: #f9fafb; font-size: 14px; line-height: 1.6; color: #111827; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">${safeMessage}</pre>
              <p style="margin: 24px 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                Reply to this email to respond directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const sent = await sendResendEmail({
    to: artistEmail,
    replyTo: fromEmailNorm,
    subject: emailSubject,
    html,
    text,
  });

  if (!sent.ok) {
    await supabase
      .from("contact_messages")
      .update({ status: "failed", error_code: "resend_failed" })
      .eq("id", msgId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  await supabase
    .from("contact_messages")
    .update({ status: "sent", resend_id: sent.id ?? null })
    .eq("id", msgId);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
