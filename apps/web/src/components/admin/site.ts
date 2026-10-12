import { cookies } from "next/headers";
import { type AdminSite, adminSites } from "./nav";

export const SITE_COOKIE = "adm_site";

/** The site the admin is currently scoped to (a UI preference; every query still filters by site on the server). */
export async function getAdminSite(): Promise<AdminSite> {
  const v = (await cookies()).get(SITE_COOKIE)?.value;
  return adminSites.some((s) => s.id === v) ? (v as AdminSite) : "hub";
}
