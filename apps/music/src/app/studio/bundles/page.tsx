import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { removeProductAction, saveBundleAction } from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Checkbox, Field, Input, Textarea } from "@/components/ui";
import { TIER_LABEL, usd } from "@/lib/format";
import { studioPage } from "@/lib/studio-page";
import { and, eq, isNull } from "drizzle-orm";
import { schema } from "@jerryqiu/db";

export const dynamic = "force-dynamic";

export default async function Bundles() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  void getDb;
  const [bundles, scores, works] = await Promise.all([
    m.listBundles(db),
    db
      .select()
      .from(schema.musicProducts)
      .where(
        and(
          eq(schema.musicProducts.kind, "score"),
          isNull(schema.musicProducts.deletedAt),
          eq(schema.musicProducts.active, true),
        ),
      ),
    m.listWorksAdmin(db),
  ]);
  const titleOf = (id: string | null) => works.find((w) => w.id === id)?.title ?? "Piece";
  return (
    <>
      <StudioHead title="Bundles" />
      <section className="st-card" aria-labelledby="existing">
        <h2 id="existing">Existing bundles</h2>
        <p className="mu-muted">
          Several scores at one price. Every score in a bundle needs the same license tier, and the bundle must cost
          less than the parts.
        </p>
        {bundles.length ? (
          bundles.map((b) => (
            <div key={b.id} className="st-rowline" style={{ alignItems: "start" }}>
              <ActionForm action={saveBundleAction} submit="Save" inline>
                <input type="hidden" name="id" value={b.id} />
                <Field label="Name">
                  <Input name="title" defaultValue={b.title} required />
                </Field>
                <Field label="Price (USD)">
                  <Input
                    name="price"
                    defaultValue={(b.priceCents / 100).toFixed(2)}
                    inputMode="decimal"
                    style={{ width: "6rem" }}
                  />
                </Field>
                <Checkbox name="active" defaultChecked={b.active} label="On sale" />
                <span className="mu-muted">
                  {TIER_LABEL[b.tier]} · {b.parts.map((p) => titleOf(p.workId)).join(", ")}
                  {b.parts.map((p) => (
                    <input key={p.id} type="hidden" name="productIds" value={p.id} />
                  ))}
                </span>
              </ActionForm>
              <ActionForm
                action={removeProductAction}
                submit="Remove"
                variant="ghost"
                inline
                confirm="Remove this bundle?"
              >
                <input type="hidden" name="id" value={b.id} />
              </ActionForm>
            </div>
          ))
        ) : (
          <p className="mu-muted">No bundles yet.</p>
        )}
      </section>
      <section className="st-card" aria-labelledby="new">
        <h2 id="new">New bundle</h2>
        {scores.length < 2 ? (
          <p className="mu-muted">Add scores to at least two pieces first.</p>
        ) : (
          <ActionForm action={saveBundleAction} submit="Create bundle" reset>
            <Field label="Name">
              <Input name="title" required />
            </Field>
            <Field label="Note (optional)">
              <Textarea name="description" rows={2} maxLength={400} />
            </Field>
            <Field label="Price (USD)">
              <Input name="price" inputMode="decimal" required />
            </Field>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="mu-muted">Scores in the bundle (pick two or more)</legend>
              {scores.map((p) => (
                <label key={p.id} className="mu-row" style={{ gap: "0.5rem", paddingBlock: "0.2rem" }}>
                  <input type="checkbox" name="productIds" value={p.id} /> {titleOf(p.workId)}: {p.title} (
                  {TIER_LABEL[p.tier]}, {usd(p.priceCents)})
                </label>
              ))}
            </fieldset>
          </ActionForm>
        )}
      </section>
    </>
  );
}
