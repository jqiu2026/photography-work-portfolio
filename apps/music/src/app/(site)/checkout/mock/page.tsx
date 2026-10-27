import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle, Button } from "@/components/ui";
import { mocksOn } from "@/lib/checkout";
import { usd } from "@/lib/format";
import { mockPayAction } from "../actions";

export const metadata = { title: "Mock payment", robots: { index: false } };

export default async function MockPay({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (!mocksOn()) notFound();
  const { token = "" } = await searchParams;
  const db = getDb();
  const found = db ? await m.orderByAccessToken(db, token) : null;
  if (!found) notFound();
  return (
    <main id="main">
      <PageHeader eyebrow="MOCK" title="Mock payment" />
      <div className="mu-wrap mu-section mu-stack">
        <Alert>
          <AlertTitle>MOCK: no card is charged</AlertTitle>
          <AlertDescription>
            This page stands in for Stripe in development and previews. In production, STRIPE_SECRET_KEY sends the buyer
            to Stripe instead.
          </AlertDescription>
        </Alert>
        <p>
          Order {m.orderNumber(found.order.seq)}: {usd(found.order.totalCents)}
        </p>
        <form action={mockPayAction}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit">Pay (mock)</Button>
        </form>
      </div>
    </main>
  );
}
