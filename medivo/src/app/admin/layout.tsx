import { requireAdmin } from "./guard";

// Every page under /admin is checked server-side; the database checks every write again.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
