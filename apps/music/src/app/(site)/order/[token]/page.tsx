import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { TIERS } from "@jerryqiu/scores";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle, Button, Tag } from "@/components/ui";
import { TIER_LABEL, usd } from "@/lib/format";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Order({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const found = db ? await m.orderByAccessToken(db, token) : null;
  if (!db || !found) notFound();
  const { order, number, lines, licenses } = found;
  const files = new Map(
    await Promise.all(licenses.map(async (l) => [l.id, await m.licenseFilesFor(db, l.id)] as const)),
  );
  return (
    <div>
      <PageHeader
        eyebrow={`Order ${number}`}
        title={
          order.status === "paid"
            ? "Your scores"
            : order.status === "refunded"
              ? "Refunded"
              : order.status === "canceled"
                ? "Not completed"
                : "Waiting for payment"
        }
      />
      <div className="mu-wrap mu-section mu-stack">
        {order.status === "pending" ? (
          <Alert>
            <AlertTitle>We are waiting for the payment to be confirmed</AlertTitle>
            <AlertDescription>
              This usually takes a few seconds.{" "}
              <Link className="mu-link" href={`/order/${token}`}>
                Refresh
              </Link>{" "}
              this page. Your downloads appear here and in your receipt email.
            </AlertDescription>
          </Alert>
        ) : null}
        {order.status === "refunded" ? (
          <Alert tone="warning">
            <AlertTitle>This order was refunded</AlertTitle>
            <AlertDescription>The licenses ended with the refund.</AlertDescription>
          </Alert>
        ) : null}
        {order.status === "paid" ? (
          <ul className="mu-list" style={{ display: "grid" }}>
            {licenses.map((l) => {
              const line = lines.find((x) => x.id === l.orderLineId);
              const fs = files.get(l.id) ?? [];
              return (
                <li key={l.id} style={{ display: "grid", gap: "0.6rem" }}>
                  <div className="mu-row" style={{ justifyContent: "space-between" }}>
                    <strong>{line?.title ?? "Score"}</strong>
                    <span className="mu-mono">{l.licenseNo}</span>
                  </div>
                  <p className="mu-muted" style={{ margin: 0 }}>
                    {TIER_LABEL[l.tier]} license, {TIERS[l.tier].summary} {l.revokedAt ? "Revoked." : ""}
                  </p>
                  <div className="mu-row">
                    {fs.length ? (
                      fs.map((f) => (
                        <Button key={f.id} asChild variant="secondary" size="sm">
                          <a href={`/api/download/${l.id}/${f.id}?t=${encodeURIComponent(token)}`} download>
                            Download {f.label}
                          </a>
                        </Button>
                      ))
                    ) : (
                      <Tag>Files will appear here when they are added</Tag>
                    )}
                    <Button asChild variant="ghost" size="sm">
                      <a href={`/api/download/${l.id}/license?t=${encodeURIComponent(token)}`} download>
                        License (PDF)
                      </a>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
        <p className="mu-muted">
          Total {usd(order.totalCents)}. Sign in to{" "}
          <Link className="mu-link" href="/library">
            your library
          </Link>{" "}
          with {order.email} to get these any time.
        </p>
      </div>
    </div>
  );
}
