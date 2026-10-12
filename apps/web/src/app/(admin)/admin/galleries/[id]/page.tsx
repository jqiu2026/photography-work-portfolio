import { schema } from "@jerryqiu/db";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton, F } from "@/components/admin/form-kit";
import { GalleryEditor } from "@/components/admin/GalleryEditor";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { deleteGallery, saveGallery } from "../actions";

const protections = [
  { value: "none", label: "Off: no protection" },
  { value: "light", label: "Light: no right-click or drag-save (public portfolio default)" },
  { value: "strict", label: "Strict: also blur on screenshot keys, signed one-time image URLs" },
];

export default async function EditGallery({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const data = isNew
    ? null
    : await withDb(async (db) => {
        const [g] = await db.select().from(schema.galleries).where(eq(schema.galleries.id, id)).limit(1);
        if (!g) return null;
        const items = await db
          .select({
            id: schema.galleryItems.id,
            mediaId: schema.galleryItems.mediaId,
            caption: schema.galleryItems.caption,
            alt: schema.galleryItems.alt,
            hidden: schema.galleryItems.hidden,
            filename: schema.media.filename,
            review: schema.media.reviewStatus,
            mediaAlt: schema.media.alt,
          })
          .from(schema.galleryItems)
          .innerJoin(schema.media, eq(schema.media.id, schema.galleryItems.mediaId))
          .where(eq(schema.galleryItems.galleryId, id))
          .orderBy(asc(schema.galleryItems.sort));
        return { g, items };
      });
  if (!isNew && data === undefined) return <NoDb />;
  if (!isNew && !data) notFound();
  const g = data?.g;
  return (
    <>
      <PageHead title={isNew ? "New gallery" : (g?.title ?? "Gallery")} />
      <ActionForm
        action={saveGallery}
        secondary={
          g ? (
            <ConfirmButton
              label="Delete"
              confirm="Move this gallery to the trash? The images stay in the media library."
              action={deleteGallery.bind(null, g.id)}
            />
          ) : undefined
        }
      >
        {g ? <F name="id" label="id" type="hidden" defaultValue={g.id} /> : null}
        <div className="adm-grid2">
          <F name="title" label="Title" defaultValue={g?.title} required />
          <F
            name="slug"
            label="URL"
            defaultValue={g?.slug}
            hint="Lowercase letters, numbers and dashes. Left empty it is made from the title."
          />
        </div>
        <F name="description" label="Description" type="textarea" rows={2} defaultValue={g?.description} />
        <div className="adm-grid2">
          <F
            name="category"
            label="Category"
            defaultValue={g?.category}
            hint="e.g. Theater, Street. Used for the subject tabs."
          />
          <F name="sort" label="Order" type="number" defaultValue={g?.sort ?? 0} min={0} />
        </div>
        <F
          name="protection"
          label="Image protection"
          type="select"
          options={protections}
          defaultValue={g?.protection ?? "light"}
          hint="A deterrent, not a lock: it cannot stop screenshots by the operating system or phone cameras."
        />
        <MediaPicker name="coverMediaId" label="Cover image" defaultValue={g?.coverMediaId} />
        <F name="visible" label="Visible on the site" type="checkbox" defaultValue={g?.visible ?? true} />
      </ActionForm>
      {g ? (
        <section style={{ marginTop: "3rem" }} aria-labelledby="imgs">
          <h2 id="imgs" style={{ fontSize: "var(--ph-text-xl)", marginBottom: "1rem" }}>
            Images
          </h2>
          <GalleryEditor
            key={(data?.items ?? []).map((i) => i.id).join(",")}
            galleryId={g.id}
            coverId={g.coverMediaId}
            items={(data?.items ?? []).map((i) => ({
              id: i.id,
              mediaId: i.mediaId,
              caption: i.caption ?? "",
              alt: i.alt ?? i.mediaAlt ?? "",
              hidden: i.hidden,
              filename: i.filename,
              needsReview: i.review === "needs_review",
            }))}
          />
        </section>
      ) : (
        <p className="adm-note" style={{ marginTop: "1.5rem" }}>
          Save the gallery first, then add images.
        </p>
      )}
    </>
  );
}
