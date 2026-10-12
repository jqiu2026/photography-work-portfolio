import { Container, Section } from "@halation/ui";
import { mocksEnabled } from "@jerryqiu/mocks";
import { MockBanner } from "@jerryqiu/sites/mock";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { PayInvoice } from "@/components/studio/ClientPortal";

export const metadata = { title: "Pay your invoice", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ invoice: string }> }) {
  if (!mocksEnabled()) notFound();
  const { invoice } = await params;
  return (
    <Shell>
      <MockBanner what="Payments are a local mock (Stripe test-mode shape, no card is charged)" />
      <Section>
        <Container size="md">
          <PayInvoice invoiceId={invoice} />
        </Container>
      </Section>
    </Shell>
  );
}
