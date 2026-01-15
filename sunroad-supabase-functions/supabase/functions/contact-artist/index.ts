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
const MAX_PER_IP_24H = Number(Deno.env.get("CONTACT_MAX_PER_IP_24H") ?? "20");
const MAX_PER_EMAIL_24H = Number(
  Deno.env.get("CONTACT_MAX_PER_EMAIL_24H") ?? "10"
);
const MAX_PER_IP_ARTIST_24H = Number(
  Deno.env.get("CONTACT_MAX_PER_IP_ARTIST_24H") ?? "5"
);

// -----------------------------
// Helpers
// -----------------------------
function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function getClientIp(req: Request): string | null {
  // Prefer Cloudflare / proxy headers; fallback to x-forwarded-for.
  const cf = req.headers.get("cf-connecting-ip");
  if (cf && cf.trim()) return cf.trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff && xff.trim()) {
    // x-forwarded-for can be "client, proxy1, proxy2"
    return xff.split(",")[0].trim();
  }

  return null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  // simple practical validation (not perfect RFC)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyTurnstile(token: string, remoteip?: string | null) {
  const form = new FormData();
  form.append("secret", TURNSTILE_SECRET_KEY);
  form.append("response", token);
  if (remoteip) form.append("remoteip", remoteip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form }
  );

  if (!res.ok) {
    return { ok: false, error: "turnstile_http_error" as const };
  }

  const data = await res.json();
  // data: { success: boolean, ... }
  if (data?.success === true) return { ok: true };
  return { ok: false, error: "turnstile_failed" as const };
}

async function sendResendEmail(params: {
  to: string;
  replyTo: string;
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Sunroad Notifications <${CONTACT_FROM_EMAIL}>`,
      to: [params.to],
      reply_to: params.replyTo,
      subject: params.subject,
      html: params.html,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: "resend_failed" as const, details: json };
  }
  return { ok: true, id: json?.id as string | undefined };
}

// -----------------------------
// Main
// -----------------------------
Deno.serve(async (req) => {
  // CORS (adjust origins to your domains)
  const origin = req.headers.get("origin") ?? "*";
  const corsHeaders = {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Service-role client (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? null;

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_json" }),
      { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  }

  const artistHandle = String(payload?.artist_handle ?? "").trim();
  const fromEmailRaw = String(payload?.from_email ?? "").trim();
  const subject = String(payload?.subject ?? "").trim();
  const message = String(payload?.message ?? "").trim();
  const turnstileToken = String(payload?.turnstile_token ?? "").trim();

  // quick validation (cheap)
  if (!artistHandle || artistHandle.length > 64) {
    return new Response(JSON.stringify({ error: "invalid_artist" }), {
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
  if (!subject || subject.length > 160) {
    return new Response(JSON.stringify({ error: "invalid_subject" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  if (!message || message.length > 4000) {
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

  // verify captcha (server-side)
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
    // log + generic response
    await supabase.from("contact_messages").insert({
      artist_id: artistId,
      artist_auth_user_id: artistAuthUserId,
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

  // Block by IP (if present)
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

  // contact gating: only Pro/grandfather Pro
  const { data: canReceive, error: canErr } = await supabase.rpc(
    "can_receive_contact",
    { p_auth_user_id: artistAuthUserId }
  );

  if (canErr || canReceive !== true) {
    // log attempt but don't reveal why
    await supabase.from("contact_messages").insert({
      artist_id: artistId,
      artist_auth_user_id: artistAuthUserId,
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

    return new Response(JSON.stringify({ error: "contact_unavailable" }), {
      status: 404,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // rate limit counts (last 24h)
  // per email
  const emailCountRes = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("from_email_hash", fromEmailHash)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const emailCount = emailCountRes.count ?? 0;

  // per ip
  let ipCount = 0;
  let ipArtistCount = 0;

  if (ipHash) {
    const ipCountRes = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    ipCount = ipCountRes.count ?? 0;

    const ipArtistCountRes = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("artist_id", artistId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    ipArtistCount = ipArtistCountRes.count ?? 0;
  }

  const throttled =
    emailCount >= MAX_PER_EMAIL_24H ||
    (ipHash ? ipCount >= MAX_PER_IP_24H || ipArtistCount >= MAX_PER_IP_ARTIST_24H : false);

  if (throttled) {
    await supabase.from("contact_messages").insert({
      artist_id: artistId,
      artist_auth_user_id: artistAuthUserId,
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

    // generic ok to avoid giving signal to attackers
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // insert accepted row
  const { data: row, error: insErr } = await supabase
    .from("contact_messages")
    .insert({
      artist_id: artistId,
      artist_auth_user_id: artistAuthUserId,
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

  const msgId = row.id as number;

  // fetch artist email via Admin API
  const userRes = await supabase.auth.admin.getUserById(artistAuthUserId);
  const artistEmail = userRes?.data?.user?.email ?? null;

  if (!artistEmail) {
    await supabase
      .from("contact_messages")
      .update({ status: "failed", error_code: "artist_email_missing" })
      .eq("id", msgId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // Compose email (simple HTML, you can style later)
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;">
      <h2 style="margin: 0 0 12px;">New message from Sunroad</h2>
      <p style="margin: 0 0 8px;"><strong>From:</strong> ${fromEmailNorm}</p>
      <p style="margin: 0 0 16px;"><strong>Subject:</strong> ${subject}</p>
      <div style="white-space: pre-wrap; border: 1px solid_tf #eee; padding: 12px; border-radius: 8px;">
${message.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}
      </div>
      <p style="margin: 16px 0 0; color: #666; font-size: 13px;">
        Reply to this email to respond directly.
      </p>
    </div>
  `;

  const sent = await sendResendEmail({
    to: artistEmail,
    replyTo: fromEmailNorm,
    subject: `Sunroad: ${subject}`,
    html,
  });

  if (!sent.ok) {
    await supabase
      .from("contact_messages")
      .update({ status: "failed", error_code: sent.error })
      .eq("id", msgId);

    // still return ok to avoid signal to attacker
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
