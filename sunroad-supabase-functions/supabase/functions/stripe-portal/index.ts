// supabase/functions/stripe-portal/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || Deno.env.get("SITE_URL") || "https://sunroad.io";

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

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response("Unauthorized", { status: 401, headers });
  }

  const auth_user_id = userData.user.id;

  const { data, error } = await supabaseAdmin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("auth_user_id", auth_user_id)
    .maybeSingle();

  if (error) {
    return new Response("DB error", { status: 500, headers });
  }
  if (!data?.stripe_customer_id) {
    return new Response("No customer", { status: 400, headers });
  }

  const baseUrl = resolveBaseUrl(req);
  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${baseUrl}/settings`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { ...headers, "content-type": "application/json" },
  });
});
