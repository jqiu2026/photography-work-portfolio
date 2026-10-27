import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { TIERS } from "@jerryqiu/scores";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SignInForm } from "@/components/SignInForm";
import { Button, EmptyState, Tag } from "@/components/ui";
import { TIER_LABEL } from "@/lib/format";
import { buyerId } from "@/lib/session";
import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "Your library", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Library() {
  const id = await buyerId();
  const db = getDb();
  const buyer = id && db ? await m.getBuyer(db, id) : null;
  if (!db || !buyer) {
    return (
      <main id="main">
        <PageHeader
          eyebrow="Scores"
          title="Your library"
          intro="Every score you have bought, any time, on any device."
        />
        <div className="mu-wrap mu-section">
          <SignInForm />
        </div>
      </main>
    );
  }
  const items = await m.libraryFor(db, buyer.id);
  const files = new Map(
    await Promise.all(items.map(async (i) => [i.license.id, await m.licenseFilesFor(db, i.license.id)] as const)),
  );
  return (
    <main id="main">
      <PageHeader eyebrow="Scores" title="Your library" intro={`Signed in as ${buyer.email}.`} />
      <div className="mu-wrap mu-section mu-stack">
        {items.length ? (
          <ul className="mu-list" style={{ display: "grid" }}>
            {items.map(({ license, work, order, number, downloads }) => (
              <li key={license.id} style={{ display: "grid", gap: "0.6rem" }}>
                <div className="mu-row" style={{ justifyContent: "space-between" }}>
                  <strong>{work.title}</strong>
                  <span className="mu-mono">{license.licenseNo}</span>
                </div>
                <p className="mu-muted" style={{ margin: 0 }}>
                  {TIER_LABEL[license.tier]} license, {TIERS[license.tier].summary} Order {number}. Downloads{" "}
                  {downloads} of {license.downloadLimit}.
                </p>
                {license.revokedAt || order.status !== "paid" ? (
                  <Tag tone="warning">Revoked</Tag>
                ) : (
                  <div className="mu-row">
                    {(files.get(license.id) ?? []).map((f) => (
                      <Button key={f.id} asChild variant="secondary" size="sm">
                        <a href={`/api/download/${license.id}/${f.id}`} download>
                          Download {f.label}
                        </a>
                      </Button>
                    ))}
                    <Button asChild variant="ghost" size="sm">
                      <a href={`/api/download/${license.id}/license`} download>
                        License (PDF)
                      </a>
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>You have not bought a score yet.</EmptyState>
        )}
        <form action={signOutAction}>
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}
