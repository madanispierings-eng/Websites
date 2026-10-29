import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Stable address for an image in private storage. Every request signs a fresh, short-lived URL with
// the visitor's own session (storage RLS decides access) and redirects to it, so images further down
// a long summary still load after the page has been open for hours.
const SIGNED_URL_SECONDS = 10 * 60;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ pad: string[] }> }) {
  const path = (await params).pad.map(decodeURIComponent).join("/");
  const supabase = await createClient();
  if (!supabase || path.split("/").some((part) => !part || part === "." || part === "..")) {
    return new NextResponse(null, { status: 404 });
  }
  const { data, error } = await supabase.storage.from("course-content").createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) return new NextResponse(null, { status: 404 });

  const response = NextResponse.redirect(data.signedUrl, 307);
  // The browser may reuse the redirect while the signed URL it points to is still valid.
  response.headers.set("Cache-Control", "private, max-age=300");
  return response;
}
