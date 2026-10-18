import { redirect } from "next/navigation";
import { requirePageUser } from "@/auth";

export const metadata = { title: "Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** The studio opens on its overview (the dashboard). */
export default async function Studio() {
  await requirePageUser("studio.access", "/studio");
  redirect("/studio/overview");
}
