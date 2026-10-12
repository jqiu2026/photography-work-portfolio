"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser, signOut } from "@/auth";
import { adminSites } from "./nav";
import { SITE_COOKIE } from "./site";

export async function setAdminSite(formData: FormData) {
  await requireUser("any");
  const site = String(formData.get("site") ?? "");
  if (!adminSites.some((s) => s.id === site)) return;
  (await cookies()).set(SITE_COOKIE, site, {
    path: "/admin",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/admin", "layout");
  const back = String(formData.get("back") ?? "/admin");
  redirect(back.startsWith("/admin") ? back : "/admin");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
