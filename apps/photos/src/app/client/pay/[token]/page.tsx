import { Button, Container, ResultCard, Section } from "@/components/ui";
import { getDb } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { MockBanner } from "@jerryqiu/sites/mock";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { orderLink } from "@/lib/order-link";
import { resolveRef } from "@/lib/portal-links";
import * as shop from "@jerryqiu/db/gallery-shop";
import * as bill from "@jerryqiu/db/billing";
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
  const ref = await resolveRef(token, "invoice");
  if (!db || !ref) notFound();
  const inv = await st.invoiceByToken(db, ref);
  if (!inv) notFound();
  const mode = paymentMode();
  const billing = await bill.getBillingSettings(db);
  const shopOrder = inv.kind === "shop" ? await shop.orderForInvoice(db, inv.id) : null;
  const net = await st.invoiceNetCents(db, inv.id);
  const dueCents = Math.max(0, inv.totalCents - net);
  return (
    <Shell>
      {mode === "mock" ? (
        <MockBanner what="Payments are a local mock (Stripe test-mode shape, no card is charged)" />
      ) : null}
      <Section>
        <Container size="sm">
          {inv.status === "paid" ? (
            <ResultCard
              eyebrow={`Invoice ${inv.number}`}
              title="Paid"
              message={`Invoice ${inv.number} is paid. Thank you.`}
            >
              <div className="pm-result__links">
                <Button asChild variant="secondary">
                  <a href={`/client/pay/${token}/receipt`}>Download the receipt (PDF)</a>
                </Button>
                {shopOrder ? (
                  <Button asChild>
                    <a href={`/g/order/${orderLink(shopOrder.id)}`}>Open your order and downloads</a>
                  </Button>
                ) : null}
              </div>
            </ResultCard>
          ) : paid ? (
            <ResultCard
              eyebrow={`Invoice ${inv.number}`}
              title="Thank you"
              message={'Your payment is being confirmed. This page will show "Paid" shortly; you can close it.'}
            />
          ) : mode === "none" ? (
            <ResultCard
              tone="neutral"
              title={`Invoice ${inv.number}`}
              message={`${usd(inv.totalCents)}. Online payment is not set up yet. Please contact the photographer to pay.`}
            />
          ) : (
            <PayForm
              token={token}
              mode={mode}
              amount={usd(dueCents || inv.totalCents)}
              options={{
                tips: billing.tipsEnabled ? billing.tipPercents : [],
                ach: billing.achEnabled,
                surchargeBp: billing.surchargeEnabled ? billing.surchargeBp : 0,
              }}
            />
          )}
          <p className="pm-foot-link">
            <Button asChild variant="ghost" size="sm">
              <a href={`/client/pay/${token}/pdf`}>Download the invoice (PDF)</a>
            </Button>
          </p>
        </Container>
      </Section>
    </Shell>
  );
}
