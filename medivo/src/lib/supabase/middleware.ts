import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/env";

const PROTECTED = ["/dashboard", "/admin"];

/** Refreshes the Supabase session cookie and sends signed-out visitors away from private areas. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = supabaseConfig();
  const isProtected = PROTECTED.some((p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`));

  if (!config) {
    if (!isProtected) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/inloggen";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const loginRedirect = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/inloggen";
    url.search = `?volgende=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  };

  // Verifying the session is a network call to Supabase. If it is slow or unreachable, don't let the
  // whole request hang (that surfaces as a Vercel 504 MIDDLEWARE_INVOCATION_TIMEOUT): cap it, and
  // degrade gracefully — public pages load without a refreshed session, protected pages fail closed.
  let user = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("auth-timeout")), 3500); }),
    ]);
    user = result.data.user;
  } catch {
    if (isProtected) return loginRedirect();
    return response;
  } finally {
    clearTimeout(timer);
  }

  if (!user && isProtected) return loginRedirect();
  return response;
}
