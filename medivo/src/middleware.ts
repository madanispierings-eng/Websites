import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files and images; everything else gets a fresh session.
  matcher: ["/((?!_next/static|_next/image|images/|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};
