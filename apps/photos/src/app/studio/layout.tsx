import type { ReactNode } from "react";
import { currentUser } from "@/auth";
import { StudioChrome } from "@/components/studio/StudioChrome";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  // the role decides which pages the sidebar and Jump to list (the pages themselves refuse the rest)
  const user = await currentUser().catch(() => null);
  return <StudioChrome role={user?.role}>{children}</StudioChrome>;
}
