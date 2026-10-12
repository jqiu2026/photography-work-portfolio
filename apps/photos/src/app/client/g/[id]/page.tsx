import { Container, Section } from "@halation/ui";
import { mocksEnabled } from "@jerryqiu/mocks";
import { MockBanner } from "@jerryqiu/sites/mock";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { ClientGallery } from "@/components/studio/ClientPortal";

export const metadata = { title: "Your gallery", robots: { index: false, follow: false } };

export default async function Page({
  params,
  searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ ml?: string }> }) {
  if (!mocksEnabled()) notFound();
  const [{ id }, { ml }] = await Promise.all([params, searchParams]);
  return (
    <Shell>
      <MockBanner what="The client gallery is a local mock with sample frames" />
      <Section>
        <Container>
          <ClientGallery id={id} magicToken={ml} />
        </Container>
      </Section>
    </Shell>
  );
}
