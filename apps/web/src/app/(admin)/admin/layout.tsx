import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requirePageUser } from "@/auth";

// Every admin page is rendered per request, after the session and role are re-checked against the database.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser("any");
  return <AdminShell user={user}>{children}</AdminShell>;
}
