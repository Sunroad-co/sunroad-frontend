// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || Deno.env.get("SITE_URL") || Deno.env.get("NEXT_PUBLIC_SITE_URL");
const REVALIDATE_SECRET = Deno.env.get("REVALIDATE_SECRET") || Deno.env.get("REVALIDATE_SECRET_TOKEN");

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function toIso(ts?: number | null) {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

function extractPeriodSeconds(sub: Stripe.Subscription, field: 'current_period_start' | 'current_period_end'): number | null {
  // Try subscription level first
  if (sub[field] !== null && sub[field] !== undefined) {
    return sub[field] as number;
  }
  // Fallback to first subscription item
  if (sub.items?.data?.[0]?.[field] !== null && sub.items?.data?.[0]?.[field] !== undefined) {
    return sub.items.data[0][field] as number;
  }
  return null;
}

async function upsertCustomer(auth_user_id: string, customerId: string, email?: string | null) {
  const payload: {
    auth_user_id: string;
    stripe_customer_id: string;
    updated_at: string;
    email?: string | null;
  } = {
    auth_user_id,
    stripe_customer_id: customerId,
    updated_at: new Date().toISOString(),
  };

  // Only include email if it's provided (not null/undefined)
  if (email !== null && email !== undefined) {
    payload.email = email;
  }

  const { error } = await supabaseAdmin
    .from("billing_customers")
    .upsert(payload, { onConflict: "auth_user_id" });

  if (error) throw error;
}

async function upsertSubscription(params: {
  stripe_subscription_id: string;
  auth_user_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  ended_at: string | null;
}) {
  const { error } = await supabaseAdmin
    .from("billing_subscriptions")
    .upsert(
      {
        stripe_subscription_id: params.stripe_subscription_id,
        auth_user_id: params.auth_user_id,
        stripe_customer_id: params.stripe_customer_id,
        stripe_price_id: params.stripe_price_id,
        status: params.status,
        cancel_at_period_end: params.cancel_at_period_end,
        current_period_start: params.current_period_start,
        current_period_end: params.current_period_end,
        ended_at: params.ended_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

  if (error) throw error;
}

async function getAuthUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("billing_customers")
    .select("auth_user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) throw error;
  return data?.auth_user_id ?? null;
}

async function callSyncEntitlement(auth_user_id: string) {
  const { error } = await supabaseAdmin.rpc("sync_stripe_entitlement", { p_auth_user_id: auth_user_id });
  if (error) throw error;
}

async function getArtistHandle(auth_user_id: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("artists_min")
    .select("handle")
    .eq("auth_user_id", auth_user_id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching artist handle:", error);
    return null;
  }
  return data?.handle ?? null;
}

async function revalidateArtistCache(auth_user_id: string) {
  // Best-effort: if this fails, log but don't throw
  try {
    if (!PUBLIC_SITE_URL) {
      console.warn("PUBLIC_SITE_URL not configured, skipping revalidation");
      return;
    }

    if (!REVALIDATE_SECRET) {
      console.warn("REVALIDATE_SECRET not configured, skipping revalidation");
      return;
    }

    const handle = await getArtistHandle(auth_user_id);
    if (!handle) {
      console.log(`No artist handle found for auth_user_id ${auth_user_id}, skipping revalidation`);
      return;
    }

    const revalidateUrl = `${PUBLIC_SITE_URL}/api/revalidate`;
    const response = await fetch(revalidateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": REVALIDATE_SECRET,
      },
      body: JSON.stringify({
        tags: [`artist:${handle}`],
        handle,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Revalidation failed: ${response.status} ${errorText}`);
    }

    console.log(`Successfully revalidated artist cache for handle: ${handle}`);
  } catch (error) {
    // Best-effort: log but don't fail the webhook
    console.error("Failed to revalidate artist cache (non-fatal):", error);
  }
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature", { status: 400 });

  const rawBody = new Uint8Array(await req.arrayBuffer());


  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, STRIPE_WEBHOOK_SECRET);

   } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    // Idempotency: only process each event once
    const { data: shouldProcess, error: idemErr } = await supabaseAdmin
      .rpc("insert_stripe_event_once", { p_event_id: event.id });

    if (idemErr) throw idemErr;
    if (!shouldProcess) return new Response("OK (duplicate)", { status: 200 });

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // We set this during checkout creation
        const auth_user_id = (session.metadata?.auth_user_id ?? session.client_reference_id) as string | undefined;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (!auth_user_id || !customerId) break;

        await upsertCustomer(auth_user_id, customerId, session.customer_details?.email ?? null);
        // subscription upsert usually comes via customer.subscription.created/updated.
        // We still sync entitlement here because sometimes it arrives first.
        await callSyncEntitlement(auth_user_id);
        await revalidateArtistCache(auth_user_id);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const auth_user_id =
          (sub.metadata?.auth_user_id as string | undefined) ?? (await getAuthUserIdFromCustomer(customerId));

        if (!auth_user_id) {
          console.warn("No auth_user_id found for subscription", sub.id);
          break;
        }

        const priceId = sub.items.data?.[0]?.price?.id;
        if (!priceId) {
          console.warn("No price id found for subscription", sub.id);
          break;
        }

        await upsertCustomer(auth_user_id, customerId);

        console.log('FULL SUBSCRIPTION OBJECT:', JSON.stringify(sub, null, 2));

        await upsertSubscription({
          stripe_subscription_id: sub.id,
          auth_user_id,
          stripe_customer_id: customerId,
          stripe_price_id: priceId,
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          current_period_start: toIso(extractPeriodSeconds(sub, 'current_period_start')),
          current_period_end: toIso(extractPeriodSeconds(sub, 'current_period_end')),
          ended_at: toIso(sub.ended_at ?? null),
        });

        await callSyncEntitlement(auth_user_id);
        await revalidateArtistCache(auth_user_id);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        // Optional: you can use this to tighten access rules or show banners.
        // Subscription events already update status.
        break;
      }

      default:
        // ignore
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error('CRITICAL WEBHOOK ERROR:', err);
    // Important: return 200 or 500?
    // Return 500 so Stripe retries if we failed to persist state.
    return new Response("Webhook error", { status: 500 });
  }
});
