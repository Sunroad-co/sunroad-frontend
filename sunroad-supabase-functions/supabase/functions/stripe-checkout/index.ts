// supabase/functions/stripe-checkout/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || Deno.env.get("SITE_URL") || "https://sunroad.io";

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  throw new Error("Missing required environment variables");
}

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://sunroad-frontend.vercel.app",
  "https://sunroad.io",
  "https://www.sunroad.io",
];

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("Origin");
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function resolveBaseUrl(req: Request): string {
  // Try Origin header first
  const origin = req.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  // Fallback to Referer header
  const referer = req.headers.get("Referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (ALLOWED_ORIGINS.includes(refererOrigin)) {
        return refererOrigin;
      }
    } catch {
      // Invalid Referer URL, ignore
    }
  }

  // Fallback to public site URL (secure default)
  return PUBLIC_SITE_URL;
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const headers = corsHeaders(req);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers });
  }

  // Verify user from JWT (sent by frontend)
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response("Unauthorized", { status: 401, headers });
  }

  const auth_user_id = userData.user.id;
  const email = userData.user.email ?? undefined;

  const body = await req.json().catch(() => ({}));
  const price_id = body?.price_id as string | undefined;
  if (!price_id) {
    return new Response("Missing price_id", { status: 400, headers });
  }

  // Ensure requested price exists & is active (prevents tampering)
  const { data: priceRow, error: priceErr } = await supabaseAdmin
    .from("billing_prices")
    .select("stripe_price_id,is_active")
    .eq("stripe_price_id", price_id)
    .maybeSingle();

  if (priceErr) {
    return new Response("DB error", { status: 500, headers });
  }
  if (!priceRow || !priceRow.is_active) {
    return new Response("Invalid price", { status: 400, headers });
  }

  // Check profile completion eligibility before allowing upgrade
  const { data: eligibilityData, error: eligibilityError } = await supabaseUserClient
    .rpc("get_profile_upgrade_eligibility", { p_auth_user_id: auth_user_id });

  if (eligibilityError) {
    console.error("Error checking profile eligibility:", eligibilityError);
    return new Response(
      JSON.stringify({ error: "Failed to check profile eligibility" }),
      { status: 500, headers: { ...headers, "content-type": "application/json" } }
    );
  }

  if (!eligibilityData?.eligible) {
    const missing = eligibilityData?.missing || [];
    return new Response(
      JSON.stringify({
        code: "PROFILE_INCOMPLETE",
        missing,
      }),
      {
        status: 400,
        headers: { ...headers, "content-type": "application/json" },
      }
    );
  }

  // Find or create Stripe customer
  const { data: existingCustomer } = await supabaseAdmin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("auth_user_id", auth_user_id)
    .maybeSingle();

  let customerId = existingCustomer?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { auth_user_id },
    });
    customerId = customer.id;

    await supabaseAdmin.from("billing_customers").upsert(
      {
        auth_user_id,
        stripe_customer_id: customerId,
        email: email ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "auth_user_id" },
    );
  }

  const baseUrl = resolveBaseUrl(req);
  const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/billing/cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: price_id, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,

    // Critical mapping: lets webhook know who this belongs to
    client_reference_id: auth_user_id,
    metadata: { auth_user_id },

    // Also attach to the subscription itself (so subscription events have it)
    subscription_data: {
      metadata: { auth_user_id },
    },

    allow_promotion_codes: true,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { ...headers, "content-type": "application/json" },
  });
});
