import { createBrowserClient } from "@supabase/ssr";

// Browser singleton to prevent multiple GoTrueClient instances
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    );
  }
  return browserClient;
}
