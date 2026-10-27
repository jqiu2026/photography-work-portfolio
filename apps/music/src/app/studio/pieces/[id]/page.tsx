import * as m from "@jerryqiu/db/music";
import { TIERS } from "@jerryqiu/scores";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteWorkAction,
  removeFileAction,
  removeMediaAction,
  removeProductAction,
  saveProductAction,
  previewPagesAction,
} from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { ScoreUploader } from "@/components/studio/ScoreUploader";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { MediaForm } from "@/components/studio/MediaForm";
import { WorkForm } from "@/components/studio/WorkForm";
import { Button, Checkbox, Field, Input, Select, Tag, Textarea } from "@/components/ui";
import { TIER_LABEL, usd } from "@/lib/format";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

const tierOptions = Object.keys(TIERS).map((t) => ({ value: t, label: TIER_LABEL[t] }));

export default async function EditPiece({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const d = await m.getWorkAdmin(db, id);
  if (!d) notFound();
  const { work, files, products, items } = d;
  const live = products.filter((p) => !p.deletedAt);
  return (
    <>
      <StudioHead title={work.title}>
        {work.status === "published" ? (
          <Button asChild variant="secondary">
            <Link href={`/compositions/${work.slug}`}>View on the site</Link>
          </Button>
        ) : null}
      </StudioHead>

      <section className="st-card" aria-labelledby="details">
        <h2 id="details">Details and rights</h2>
        <WorkForm work={work} />
      </section>

      <section className="st-card" aria-labelledby="files">
        <h2 id="files">Score files</h2>
        {files.map((f) => (
          <div key={f.id} className="st-rowline">
            <span>
              {f.label}{" "}
              <span className="mu-muted">
                · {f.filename}
                {f.pages ? ` · ${f.pages} pages` : ""} · {Math.round(f.bytes / 1024)} KB
              </span>
            </span>
            <span className="mu-row">
              {f.kind === "full-score" && f.mime === "application/pdf" ? (
                <ActionForm action={previewPagesAction} submit="Set" inline variant="ghost" className="mu-form" refresh>
                  <input type="hidden" name="id" value={f.id} />
                  <Field label="Preview pages" hideLabel>
                    <Input
                      name="pages"
                      type="number"
                      min={0}
                      max={10}
                      defaultValue={f.previewPages}
                      style={{ width: "5rem" }}
                      aria-label={`Preview pages for ${f.label}`}
                    />
                  </Field>
                </ActionForm>
              ) : null}
              <ActionForm
                action={removeFileAction}
                submit="Remove"
                variant="ghost"
                inline
                confirm={`Remove ${f.label}? Buyers who have a license can no longer download it.`}
              >
                <input type="hidden" name="id" value={f.id} />
              </ActionForm>
            </span>
          </div>
        ))}
        {!files.length ? <p className="mu-muted">No files yet.</p> : null}
        <ScoreUploader workId={work.id} />
      </section>

      <section className="st-card" aria-labelledby="products">
        <h2 id="products">What is for sale</h2>
        <p className="mu-muted">
          Each product is one license tier at one price. A piece can have several (personal, ensemble, institution).
          Prices are placeholders until you set them.
        </p>
        {live.map((p) => (
          <div key={p.id} className="st-rowline" style={{ alignItems: "start" }}>
            <ActionForm action={saveProductAction} submit="Save" inline className="mu-form">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="workId" value={work.id} />
              <Field label="Name">
                <Input name="title" defaultValue={p.title} required />
              </Field>
              <Field label="License">
                <Select name="tier" defaultValue={p.tier} options={tierOptions} />
              </Field>
              <Field label="Price (USD)">
                <Input
                  name="price"
                  defaultValue={(p.priceCents / 100).toFixed(2)}
                  inputMode="decimal"
                  style={{ width: "6rem" }}
                />
              </Field>
              <Field label="Files">
                <FilePicker files={files} chosen={p.fileIds} />
              </Field>
              <Checkbox name="active" defaultChecked={p.active} label="On sale" />
            </ActionForm>
            <ActionForm
              action={removeProductAction}
              submit="Remove"
              variant="ghost"
              inline
              confirm="Remove this product? It disappears from the store; past orders stay."
            >
              <input type="hidden" name="id" value={p.id} />
            </ActionForm>
          </div>
        ))}
        <ActionForm action={saveProductAction} submit="Add product" reset className="mu-form">
          <input type="hidden" name="workId" value={work.id} />
          <div className="st-grid2">
            <Field label="Name" hint="For example: Score, personal license.">
              <Input name="title" required />
            </Field>
            <Field label="License">
              <Select name="tier" defaultValue="personal" options={tierOptions} />
            </Field>
            <Field label="Price (USD)">
              <Input name="price" inputMode="decimal" required placeholder="12.00" />
            </Field>
          </div>
          <Field label="Files" hint="None ticked = every file of the piece.">
            <FilePicker files={files} chosen={[]} />
          </Field>
          <Field label="Note shown with the offer (optional)">
            <Textarea name="description" rows={2} maxLength={400} />
          </Field>
        </ActionForm>
      </section>

      <section className="st-card" aria-labelledby="media">
        <h2 id="media">Recordings and performances</h2>
        {items
          .filter((i) => !i.deletedAt)
          .map((i) => (
            <div key={i.id} className="st-rowline">
              <span>
                <Tag>{i.kind}</Tag> {i.title}{" "}
                <span className="mu-muted">{[i.provider, i.date, i.venue].filter(Boolean).join(" · ")}</span>
              </span>
              <ActionForm action={removeMediaAction} submit="Remove" variant="ghost" inline>
                <input type="hidden" name="id" value={i.id} />
              </ActionForm>
            </div>
          ))}
        <MediaForm workId={work.id} />
      </section>

      <section className="st-card" aria-labelledby="danger">
        <h2 id="danger">Delete this piece</h2>
        <p className="mu-muted">It is hidden and its products stop selling. Past orders and licenses stay valid.</p>
        <ActionForm action={deleteWorkAction} submit="Delete piece" variant="danger" confirm={`Delete ${work.title}?`}>
          <input type="hidden" name="id" value={work.id} />
        </ActionForm>
      </section>
      <p className="mu-muted">
        {live.length ? `Cheapest: ${usd(Math.min(...live.map((p) => p.priceCents)))}.` : "Nothing for sale yet."}
      </p>
    </>
  );
}

function FilePicker({ files, chosen }: { files: { id: string; label: string }[]; chosen: string[] }) {
  if (!files.length) return <span className="mu-muted">Upload a file first.</span>;
  return (
    <span className="mu-row">
      {files.map((f) => (
        <label key={f.id} className="mu-row" style={{ gap: "0.4rem" }}>
          <input type="checkbox" name="fileIds" value={f.id} defaultChecked={chosen.includes(f.id)} /> {f.label}
        </label>
      ))}
    </span>
  );
}
