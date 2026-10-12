import { Container, Section } from "@halation/ui";
import { getDb } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { MockBanner } from "@jerryqiu/sites/mock";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { PayForm } from "@/components/studio/ClientForms";
import { paymentMode } from "@/lib/payment-config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pay your invoice", robots: { index: false, follow: false } };

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default async function PayPage({
  params,
  searchParams,
}: { params: Promise<{ token: string }>; searchParams: Promise<{ paid?: string }> }) {
  const [{ token }, { paid }] = await Promise.all([params, searchParams]);
  const db = getDb();
  if (!db || token.length > 80) notFound();
  const inv = await st.invoiceByToken(db, token);
  if (!inv) notFound();
  const mode = paymentMode();
  return (
    <Shell>
      {mode === "mock" ? (
        <MockBanner what="Payments are a local mock (Stripe test-mode shape, no card is charged)" />
      ) : null}
      <Section>
        <Container size="md">
          {inv.status === "paid" ? (
            <section className="st-card">
              <h1 className="st-title">Paid</h1>
              <p className="st-note" role="status">
                Invoice {inv.number} is paid. Thank you.
              </p>
            </section>
          ) : paid ? (
            <section className="st-card">
              <h1 className="st-title">Thank you</h1>
              <p className="st-note" role="status">
                Your payment is being confirmed. This page will show "Paid" shortly; you can close it.
              </p>
            </section>
          ) : mode === "none" ? (
            <section className="st-card">
              <h1 className="st-title">Invoice {inv.number}</h1>
              <p className="st-note">
                {usd(inv.totalCents)}. Online payment is not set up yet. Please contact the photographer to pay.
              </p>
            </section>
          ) : (
            <PayForm token={token} mode={mode} amount={usd(inv.totalCents)} />
          )}
        </Container>
      </Section>
    </Shell>
  );
}
