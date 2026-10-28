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

  const { data } = await supabase.auth.getUser();

  if (!data.user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/inloggen";
    url.search = `?volgende=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return response;
}
