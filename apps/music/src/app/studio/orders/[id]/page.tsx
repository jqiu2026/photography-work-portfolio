import * as m from "@jerryqiu/db/music";
import { notFound } from "next/navigation";
import { downloadLimitAction, refundOrderAction, resendReceiptAction } from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Field, Input, Tag } from "@/components/ui";
import { TIER_LABEL, usd } from "@/lib/format";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const d = await m.orderDetail(db, id);
  if (!d) notFound();
  const { order, number, lines, licenses, downloads } = d;
  return (
    <>
      <StudioHead title={`Order ${number}`} />
      <section className="st-card">
        <div className="st-rowline">
          <span>
            {order.holderName}{" "}
            <span className="mu-muted">
              {order.email}
              {order.organization ? ` · ${order.organization}` : ""}
            </span>
          </span>
          <Tag>{order.status}</Tag>
        </div>
        {lines.map((l) => (
          <div key={l.id} className="st-rowline">
            <span>
              {l.title} <span className="mu-muted">· {TIER_LABEL[l.tier]}</span>
            </span>
            <span>{usd(l.priceCents)}</span>
          </div>
        ))}
        <div className="st-rowline">
          <span className="mu-muted">Card fee (passed to the buyer)</span>
          <span className="mu-muted">{usd(order.feeCents)}</span>
        </div>
        <div className="st-rowline">
          <strong>Total</strong>
          <strong>{usd(order.totalCents)}</strong>
        </div>
        <p className="mu-muted">
          {order.provider
            ? `Paid with ${order.provider}${order.providerRef ? ` (${order.providerRef})` : ""}.`
            : "Not paid."}
        </p>
      </section>
      {licenses.length ? (
        <section className="st-card">
          <h2>Licenses</h2>
          {licenses.map((l) => (
            <div key={l.id} className="st-rowline">
              <span>
                <span className="mu-mono">{l.licenseNo}</span> {l.revokedAt ? <Tag tone="warning">revoked</Tag> : null}{" "}
                <span className="mu-muted">{downloads.find((x) => x.licenseId === l.id)?.n ?? 0} downloads</span>
              </span>
              <ActionForm action={downloadLimitAction} submit="Set limit" variant="secondary" inline>
                <input type="hidden" name="id" value={l.id} />
                <Field label="Download limit">
                  <Input
                    name="limit"
                    type="number"
                    min={1}
                    max={1000}
                    defaultValue={l.downloadLimit}
                    style={{ width: "6rem" }}
                  />
                </Field>
              </ActionForm>
            </div>
          ))}
        </section>
      ) : null}
      {order.status === "paid" ? (
        <section className="st-card">
          <h2>Actions</h2>
          <div className="mu-row">
            <ActionForm action={resendReceiptAction} submit="Resend receipt" variant="secondary" inline>
              <input type="hidden" name="id" value={order.id} />
            </ActionForm>
            <ActionForm
              action={refundOrderAction}
              submit="Refund and end the licenses"
              variant="danger"
              inline
              confirm={`Refund ${number} (${usd(order.totalCents)})? This ends the licenses.`}
            >
              <input type="hidden" name="id" value={order.id} />
            </ActionForm>
          </div>
        </section>
      ) : null}
    </>
  );
}
