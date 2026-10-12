import { getSite } from "@jerryqiu/sites";
import { redirect } from "next/navigation";

/** Staff sign-in lives on the hub; come back here afterwards. */
export default async function SignIn({
  searchParams,
}: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const sp = await searchParams;
  const back = `${getSite("photos").url}${sp.callbackUrl?.startsWith("/") && !sp.callbackUrl.startsWith("//") ? sp.callbackUrl : "/studio"}`;
  const q = new URLSearchParams({ callbackUrl: back });
  if (sp.error) q.set("error", sp.error);
  redirect(`${getSite("hub").url}/sign-in?${q}`);
}
