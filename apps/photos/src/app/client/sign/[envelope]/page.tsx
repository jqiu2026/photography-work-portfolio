import { Container, Section } from "@halation/ui";
import { mocksEnabled } from "@jerryqiu/mocks";
import { MockBanner } from "@jerryqiu/sites/mock";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { SignContract } from "@/components/studio/ClientPortal";

export const metadata = { title: "Sign your contract", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ envelope: string }> }) {
  if (!mocksEnabled()) notFound();
  const { envelope } = await params;
  return (
    <Shell>
      <MockBanner what="E-signature is a local mock (typed name only)" />
      <Section>
        <Container size="md">
          <SignContract envelopeId={envelope} />
        </Container>
      </Section>
    </Shell>
  );
}
