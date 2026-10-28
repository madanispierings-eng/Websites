// On Vercel the production domain is known without extra configuration; NEXT_PUBLIC_SITE_URL overrides it.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000")
).replace(/\/$/, "");

/**
 * Until launch the site stays out of search engines and keeps the /dev/oefenen demo available.
 * Set MEDIVO_LAUNCHED=1 in the hosting environment when Medivo goes public.
 */
export const isLaunched = process.env.MEDIVO_LAUNCHED === "1";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Accounts, progress and learning content need Supabase; the public catalogue does not. */
export function supabaseConfig() {
  return supabaseUrl && supabaseAnonKey ? { url: supabaseUrl, anonKey: supabaseAnonKey } : null;
}

export const isSupabaseConfigured = () => supabaseConfig() !== null;
