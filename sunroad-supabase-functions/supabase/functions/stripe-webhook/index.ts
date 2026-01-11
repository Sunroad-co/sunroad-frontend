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
  console.log('[upsertCustomer] Starting:', { auth_user_id, customerId, email });
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

  console.log('[upsertCustomer] Payload:', JSON.stringify(payload, null, 2));
  const { error } = await supabaseAdmin
    .from("billing_customers")
    .upsert(payload, { onConflict: "auth_user_id" });

  if (error) {
    console.error('[upsertCustomer] Error:', error);
    throw error;
  }
  console.log('[upsertCustomer] Success');
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
  event_created_at: string;
}) {
  console.log('[upsertSubscription] Starting with params:', JSON.stringify(params, null, 2));
  const rpcParams = {
    p_stripe_subscription_id: params.stripe_subscription_id,
    p_auth_user_id: params.auth_user_id,
    p_stripe_customer_id: params.stripe_customer_id,
    p_stripe_price_id: params.stripe_price_id,
    p_status: params.status,
    p_cancel_at_period_end: params.cancel_at_period_end,
    p_current_period_start: params.current_period_start,
    p_current_period_end: params.current_period_end,
    p_ended_at: params.ended_at,
    p_event_created_at: params.event_created_at,
  };
  console.log('[upsertSubscription] RPC params:', JSON.stringify(rpcParams, null, 2));
  
  const { data, error } = await supabaseAdmin.rpc("upsert_billing_subscription_safe", rpcParams);

  if (error) {
    console.error('[upsertSubscription] RPC Error:', JSON.stringify(error, null, 2));
    throw error;
  }
  console.log('[upsertSubscription] RPC Success, returned data:', JSON.stringify(data, null, 2));
}

async function getAuthUserIdFromCustomer(customerId: string): Promise<string | null> {
  console.log('[getAuthUserIdFromCustomer] Looking up customer:', customerId);
  const { data, error } = await supabaseAdmin
    .from("billing_customers")
    .select("auth_user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.error('[getAuthUserIdFromCustomer] Error:', error);
    throw error;
  }
  const auth_user_id = data?.auth_user_id ?? null;
  console.log('[getAuthUserIdFromCustomer] Result:', auth_user_id);
  return auth_user_id;
}

async function callSyncEntitlement(auth_user_id: string) {
  console.log('[callSyncEntitlement] Starting for auth_user_id:', auth_user_id);
  const { error } = await supabaseAdmin.rpc("sync_stripe_entitlement", { p_auth_user_id: auth_user_id });
  if (error) {
    console.error('[callSyncEntitlement] Error:', error);
    throw error;
  }
  console.log('[callSyncEntitlement] Success');
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
    console.log('='.repeat(80));
    console.log('[WEBHOOK] Received event:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode,
    });
    console.log('[WEBHOOK] Full event object:', JSON.stringify(event, null, 2));
    console.log('='.repeat(80));

    // Idempotency: only process each event once
    console.log('[WEBHOOK] Checking idempotency for event:', event.id);
    const { data: shouldProcess, error: idemErr } = await supabaseAdmin
      .rpc("insert_stripe_event_once", { p_event_id: event.id });

    if (idemErr) {
      console.error('[WEBHOOK] Idempotency check error:', idemErr);
      throw idemErr;
    }
    console.log('[WEBHOOK] Idempotency check result - shouldProcess:', shouldProcess);
    if (!shouldProcess) {
      console.log('[WEBHOOK] Event already processed, skipping (duplicate)');
      return new Response("OK (duplicate)", { status: 200 });
    }

    // Handle events
    console.log('[WEBHOOK] Processing event type:', event.type);
    switch (event.type) {
      case "checkout.session.completed": {
        console.log('[WEBHOOK] Handling checkout.session.completed');
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[WEBHOOK] Full session object:', JSON.stringify(session, null, 2));

        // We set this during checkout creation
        const auth_user_id = (session.metadata?.auth_user_id ?? session.client_reference_id) as string | undefined;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

        console.log('[WEBHOOK] Extracted values:', { auth_user_id, customerId, email: session.customer_details?.email });

        if (!auth_user_id || !customerId) {
          console.warn('[WEBHOOK] Missing auth_user_id or customerId, skipping');
          break;
        }

        await upsertCustomer(auth_user_id, customerId, session.customer_details?.email ?? null);
        // subscription upsert usually comes via customer.subscription.created/updated.
        // We still sync entitlement here because sometimes it arrives first.
        await callSyncEntitlement(auth_user_id);
        await revalidateArtistCache(auth_user_id);
        console.log('[WEBHOOK] checkout.session.completed processing complete');
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        console.log(`[WEBHOOK] Handling ${event.type}`);
        const sub = event.data.object as Stripe.Subscription;
        console.log('[WEBHOOK] Full subscription object:', JSON.stringify(sub, null, 2));

        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        console.log('[WEBHOOK] Extracted customerId:', customerId);
        console.log('[WEBHOOK] Subscription metadata:', JSON.stringify(sub.metadata, null, 2));

        const auth_user_id =
          (sub.metadata?.auth_user_id as string | undefined) ?? (await getAuthUserIdFromCustomer(customerId));

        console.log('[WEBHOOK] Resolved auth_user_id:', auth_user_id);

        if (!auth_user_id) {
          console.warn("[WEBHOOK] No auth_user_id found for subscription", sub.id);
          break;
        }

        const priceId = sub.items.data?.[0]?.price?.id;
        console.log('[WEBHOOK] Extracted priceId:', priceId);
        console.log('[WEBHOOK] Subscription items:', JSON.stringify(sub.items.data, null, 2));

        if (!priceId) {
          console.warn("[WEBHOOK] No price id found for subscription", sub.id);
          break;
        }

        const periodStart = extractPeriodSeconds(sub, 'current_period_start');
        const periodEnd = extractPeriodSeconds(sub, 'current_period_end');
        console.log('[WEBHOOK] Period dates (raw):', { periodStart, periodEnd });
        console.log('[WEBHOOK] Period dates (ISO):', {
          current_period_start: toIso(periodStart),
          current_period_end: toIso(periodEnd),
        });

        await upsertCustomer(auth_user_id, customerId);

        const subscriptionParams = {
          stripe_subscription_id: sub.id,
          auth_user_id,
          stripe_customer_id: customerId,
          stripe_price_id: priceId,
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          current_period_start: toIso(periodStart),
          current_period_end: toIso(periodEnd),
          ended_at: toIso(sub.ended_at ?? null),
          event_created_at: new Date(event.created * 1000).toISOString(),
        };
        console.log('[WEBHOOK] Subscription params before upsert:', JSON.stringify(subscriptionParams, null, 2));

        await upsertSubscription(subscriptionParams);

        await callSyncEntitlement(auth_user_id);
        await revalidateArtistCache(auth_user_id);
        console.log(`[WEBHOOK] ${event.type} processing complete`);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        console.log(`[WEBHOOK] Handling ${event.type}`);
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[WEBHOOK] Full invoice object:', JSON.stringify(invoice, null, 2));

        // Extract subscription and customer IDs
        const subscriptionId = typeof invoice.subscription === "string" 
          ? invoice.subscription 
          : invoice.subscription?.id;
        const customerId = typeof invoice.customer === "string" 
          ? invoice.customer 
          : invoice.customer?.id;

        console.log('[WEBHOOK] Extracted IDs:', { subscriptionId, customerId, invoiceId: invoice.id });

        if (!subscriptionId || !customerId) {
          console.warn("[WEBHOOK] Missing subscription or customer ID in invoice event", invoice.id);
          break;
        }

        // Resolve auth_user_id in priority order
        let auth_user_id: string | null = null;
        
        // a) Try subscription_details metadata
        console.log('[WEBHOOK] Checking subscription_details metadata:', JSON.stringify(invoice.subscription_details?.metadata, null, 2));
        if (invoice.subscription_details?.metadata?.auth_user_id) {
          auth_user_id = invoice.subscription_details.metadata.auth_user_id as string;
          console.log('[WEBHOOK] Found auth_user_id in subscription_details.metadata:', auth_user_id);
        }
        
        // b) Try first line item metadata
        if (!auth_user_id && invoice.lines?.data?.[0]?.metadata?.auth_user_id) {
          auth_user_id = invoice.lines.data[0].metadata.auth_user_id as string;
          console.log('[WEBHOOK] Found auth_user_id in line item metadata:', auth_user_id);
        }
        
        // c) Fallback to customer lookup
        if (!auth_user_id) {
          console.log('[WEBHOOK] Falling back to customer lookup');
          auth_user_id = await getAuthUserIdFromCustomer(customerId);
        }

        console.log('[WEBHOOK] Final resolved auth_user_id:', auth_user_id);

        if (!auth_user_id) {
          console.warn("[WEBHOOK] No auth_user_id found for invoice", invoice.id);
          break;
        }

        // Retrieve fresh subscription from Stripe
        console.log('[WEBHOOK] Retrieving subscription from Stripe:', subscriptionId);
        let sub: Stripe.Subscription;
        try {
          sub = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price'],
          });
          console.log('[WEBHOOK] Retrieved subscription from Stripe:', JSON.stringify(sub, null, 2));
        } catch (err) {
          console.error("[WEBHOOK] Failed to retrieve subscription from Stripe:", err);
          break;
        }

        const priceId = sub.items.data?.[0]?.price?.id;
        console.log('[WEBHOOK] Extracted priceId from retrieved subscription:', priceId);
        if (!priceId) {
          console.warn("[WEBHOOK] No price id found for subscription", sub.id);
          break;
        }

        const periodStart = extractPeriodSeconds(sub, 'current_period_start');
        const periodEnd = extractPeriodSeconds(sub, 'current_period_end');
        console.log('[WEBHOOK] Period dates from retrieved subscription:', {
          periodStart,
          periodEnd,
          current_period_start: toIso(periodStart),
          current_period_end: toIso(periodEnd),
        });

        const subscriptionParams = {
          stripe_subscription_id: sub.id,
          auth_user_id,
          stripe_customer_id: customerId,
          stripe_price_id: priceId,
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          current_period_start: toIso(periodStart),
          current_period_end: toIso(periodEnd),
          ended_at: toIso(sub.ended_at ?? null),
          event_created_at: new Date(event.created * 1000).toISOString(),
        };
        console.log('[WEBHOOK] Subscription params before upsert (from invoice):', JSON.stringify(subscriptionParams, null, 2));

        // Upsert subscription using invoice event timestamp
        await upsertSubscription(subscriptionParams);

        await callSyncEntitlement(auth_user_id);
        await revalidateArtistCache(auth_user_id);
        console.log(`[WEBHOOK] ${event.type} processing complete`);
        break;
      }

      case "invoice.payment_failed": {
        // Optional: you can use this to tighten access rules or show banners.
        // Subscription events already update status.
        break;
      }

      default:
        console.log('[WEBHOOK] Unhandled event type:', event.type);
        // ignore
        break;
    }

    console.log('[WEBHOOK] Event processing complete, returning 200 OK');
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error('CRITICAL WEBHOOK ERROR:', err);
    // Important: return 200 or 500?
    // Return 500 so Stripe retries if we failed to persist state.
    return new Response("Webhook error", { status: 500 });
  }
});
