import { Shell } from "@/components/Shell";
import { StudioApp } from "@/components/studio/StudioApp";
import { studioSections } from "@/components/studio/sections";
import { requirePageUser } from "@/auth";
import { mocksEnabled } from "@jerryqiu/mocks";
import { MockBanner } from "@jerryqiu/sites/mock";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio", robots: { index: false, follow: false } };

/** Studio mock (Phase 2.5): clients, shoots, galleries, bookings, contracts, invoices. Owner only; mocks off in production. */
export default async function StudioSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!mocksEnabled() || !studioSections.some((s) => s.id === section)) notFound();
  const user = await requirePageUser("studio.access", `/studio/${section}`);
  return (
    <Shell>
      <MockBanner what="The studio platform is a local mock" />
      <StudioApp section={section} user={user.name ?? user.email ?? "owner"} />
    </Shell>
  );
}
