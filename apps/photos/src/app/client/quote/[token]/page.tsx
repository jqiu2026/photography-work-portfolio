import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Container,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Prose,
  Section,
  Status,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
} from "@/components/ui";
import { getDb } from "@jerryqiu/db";
import * as com from "@jerryqiu/db/commerce";
import { formatMoney, approx } from "@jerryqiu/db/pricing";
import { MockBanner } from "@jerryqiu/sites/mock";
import { notFound } from "next/navigation";
import { QuoteActions } from "@/components/QuoteActions";
import { Shell } from "@/components/Shell";
import { resolveRef } from "@/lib/portal-links";

export const dynamic = "force-dynamic";
const STATUS: Record<string, string> = {
  draft: "Draft",
  sent: "Waiting for your answer",
  viewed: "Waiting for your answer",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
};

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
  const row = (label: React.ReactNode, amount: React.ReactNode, strong?: boolean) => (
    <TableRow>
      <TableCell rowHeader={strong}>{label}</TableCell>
      <TableCell className="pm-num">{strong ? <strong>{amount}</strong> : amount}</TableCell>
    </TableRow>
  );
  return (
    <Shell cta={false}>
      {q.isSample ? <MockBanner what="This quote uses SAMPLE prices from the example catalog" /> : null}
      <Section>
        <Container size="sm">
          <section className="pm-doc" aria-labelledby="q-title">
            <PageHeader>
              <PageEyebrow>Quote {q.number}</PageEyebrow>
              <PageTitle id="q-title">{q.title}</PageTitle>
              <PageDescription>
                <Status tone={q.status === "accepted" ? "success" : open ? "accent" : "muted"}>
                  {STATUS[q.status] ?? q.status}
                </Status>
                {q.validUntil && open ? ` Valid until ${q.validUntil.toISOString().slice(0, 10)}.` : ""}
              </PageDescription>
            </PageHeader>
            {q.intro ? <Prose>{q.intro}</Prose> : null}
            {q.fields?.length ? (
              <dl aria-label="Details">
                {q.fields.map((f) => (
                  <div key={f.label} style={{ display: "flex", gap: "0.8rem" }}>
                    <dt style={{ minWidth: "8rem", opacity: 0.7 }}>{f.label}</dt>
                    <dd style={{ margin: 0 }}>{f.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <Table aria-label="Quote lines">
              <TableBody>
                {q.lines.map((l, i) => (
                  <TableRow key={`${l.description}-${i}`}>
                    <TableCell>
                      {l.description}
                      {l.qty > 1 ? ` × ${l.qty}` : ""}
                      {l.standaloneCents ? (
                        <Text as="span" size="xs" tone="muted">
                          {" "}
                          (sells for {money(l.standaloneCents)} on its own)
                        </Text>
                      ) : null}
                    </TableCell>
                    <TableCell className="pm-num">{l.amountCents === 0 ? "Included" : money(l.amountCents)}</TableCell>
                  </TableRow>
                ))}
                {q.taxCents > 0
                  ? row(`${q.taxLabel ?? "Sales tax"} (${(q.taxRateBp / 100).toFixed(2)}%)`, money(q.taxCents))
                  : null}
                {row("Total", money(q.totalCents), true)}
                {q.giftCents > 0 ? row("Gift card", `−${money(q.giftCents)}`) : null}
                {q.depositCents > 0 ? row("Deposit due on acceptance", money(q.depositCents)) : null}
              </TableBody>
            </Table>
            {est ? (
              <Text size="sm" tone="muted">
                {est}. You are charged in US dollars.
              </Text>
            ) : null}
            {q.terms ? (
              <Accordion type="single" collapsible>
                <AccordionItem value="terms">
                  <AccordionTrigger>Terms</AccordionTrigger>
                  <AccordionContent>
                    <Prose style={{ whiteSpace: "pre-wrap" }}>{q.terms}</Prose>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : null}
            {q.status === "accepted" ? (
              <Alert tone="success">
                Accepted by {q.acceptedBy} on {q.acceptedAt?.toISOString().slice(0, 10)}.
              </Alert>
            ) : null}
            {q.status === "expired" ? (
              <Alert tone="warning" className="st-error">
                This quote has expired. Ask for a new one.
              </Alert>
            ) : null}
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
          <Text size="xs" tone="dim" style={{ marginTop: "var(--hm-space-8)" }}>
            Not legal or tax advice. Sales tax shown here is a calculation at quote time.
          </Text>
        </Container>
      </Section>
    </Shell>
  );
}
