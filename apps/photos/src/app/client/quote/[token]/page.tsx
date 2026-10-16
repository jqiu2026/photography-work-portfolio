import { Container, Section, Text } from "@halation/ui";
import { getDb } from "@jerryqiu/db";
import * as com from "@jerryqiu/db/commerce";
import { formatMoney, approx } from "@jerryqiu/db/pricing";
import { MockBanner } from "@jerryqiu/sites/mock";
import { notFound } from "next/navigation";
import { QuoteActions } from "@/components/QuoteActions";
import { Shell } from "@/components/Shell";
import { resolveRef } from "@/lib/portal-links";
import "@/components/studio/studio.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your quote", robots: { index: false, follow: false } };

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const ref = await resolveRef(token, "quote");
  if (!db || !ref) notFound();
  const q = await com.quoteByToken(db, ref);
  if (!q) notFound();
  const money = (c: number) => formatMoney(c, q.currency);
  const open = q.status === "sent" || q.status === "viewed";
  const addOns = (await com.listAddOns(db)).filter((a) => a.upsell && a.visible);
  const chosen = new Map(q.lines.filter((l) => l.refId && l.amountCents > 0).map((l) => [l.refId as string, l.qty]));
  const est = approx(q.totalCents, "eur");
  return (
    <Shell>
      {q.isSample ? <MockBanner what="This quote uses SAMPLE prices from the example catalogue" /> : null}
      <Section>
        <Container size="md">
          <section className="st-card" aria-labelledby="q-title">
            <p className="hl-eyebrow">Quote {q.number}</p>
            <h1 className="st-title" id="q-title">
              {q.title}
            </h1>
            {q.intro ? <p className="st-note">{q.intro}</p> : null}
            <table className="st-table" aria-label="Quote lines">
              <tbody>
                {q.lines.map((l, i) => (
                  <tr key={`${l.description}-${i}`}>
                    <td>
                      {l.description}
                      {l.qty > 1 ? ` × ${l.qty}` : ""}
                      {l.standaloneCents ? <small> (sells for {money(l.standaloneCents)} on its own)</small> : null}
                    </td>
                    <td style={{ textAlign: "right" }}>{l.amountCents === 0 ? "Included" : money(l.amountCents)}</td>
                  </tr>
                ))}
                {q.taxCents > 0 ? (
                  <tr>
                    <td>
                      {q.taxLabel ?? "Sales tax"} ({(q.taxRateBp / 100).toFixed(2)}%)
                    </td>
                    <td style={{ textAlign: "right" }}>{money(q.taxCents)}</td>
                  </tr>
                ) : null}
                <tr>
                  <th scope="row">Total</th>
                  <th style={{ textAlign: "right" }}>{money(q.totalCents)}</th>
                </tr>
                {q.giftCents > 0 ? (
                  <tr>
                    <td>Gift card</td>
                    <td style={{ textAlign: "right" }}>−{money(q.giftCents)}</td>
                  </tr>
                ) : null}
                {q.depositCents > 0 ? (
                  <tr>
                    <td>Deposit due on acceptance</td>
                    <td style={{ textAlign: "right" }}>{money(q.depositCents)}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {est ? <p className="st-note">{est}. You are charged in US dollars.</p> : null}
            <p className="st-note">
              Status: <strong>{q.status}</strong>
              {q.validUntil && open ? ` · valid until ${q.validUntil.toISOString().slice(0, 10)}` : ""}
            </p>
            {q.terms ? (
              <details>
                <summary>Terms</summary>
                <p className="st-note" style={{ whiteSpace: "pre-wrap" }}>
                  {q.terms}
                </p>
              </details>
            ) : null}
            {q.status === "accepted" ? (
              <p role="status" className="st-note">
                Accepted by {q.acceptedBy} on {q.acceptedAt?.toISOString().slice(0, 10)}.
              </p>
            ) : null}
            {q.status === "expired" ? <p className="st-error">This quote has expired. Ask for a new one.</p> : null}
          </section>
          <QuoteActions
            token={token}
            open={open}
            depositCents={q.depositCents}
            upsells={addOns.map((a) => ({
              id: a.id,
              name: a.name,
              price: a.isSample ? "$XX" : money(a.priceCents),
              unit: a.unit,
              qty: chosen.get(a.id) ?? 0,
              max: a.maxQty,
            }))}
          />
          <Text size="sm" tone="muted" style={{ marginTop: "2rem" }}>
            Not legal or tax advice. Sales tax shown here is a calculation at quote time.
          </Text>
        </Container>
      </Section>
    </Shell>
  );
}
