import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

/**
 * Next.js Proxy (formerly middleware)
 * Only runs on protected routes to avoid impacting public SSG/ISR/CSR pages
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Only match protected routes:
     * - /dashboard/** (all dashboard routes)
     * 
     * Excludes:
     * - / (home page - static)
     * - /artists/** (artist profiles - ISR)
     * - /search (search page - CSR)
     * - /auth/** (auth pages - static)
     * - /api/** (API routes - protected at route level)
     * - Static assets (_next/static, _next/image, images, etc.)
     */
    "/dashboard/:path*",
  ],
};

