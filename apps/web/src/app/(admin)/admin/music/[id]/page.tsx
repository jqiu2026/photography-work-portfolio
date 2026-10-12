import { schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton, F } from "@/components/admin/form-kit";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { deleteMusic, saveMusic } from "../actions";

const rights = [
  { value: "original", label: "Original: my own work" },
  { value: "cover", label: "Cover of someone else's piece (link out, do not host)" },
  { value: "licensed", label: "Licensed" },
  { value: "third-party-embed", label: "Third-party embed" },
];
const providers = [
  { value: "", label: "No embedded player" },
  ...["youtube", "spotify", "soundcloud", "bandcamp"].map((v) => ({
    value: v,
    label: v[0].toUpperCase() + v.slice(1),
  })),
];

export default async function EditMusic({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const row = isNew
    ? null
    : await withDb(
        async (db) => (await db.select().from(schema.musicItems).where(eq(schema.musicItems.id, id)).limit(1))[0],
      );
  if (!isNew && row === undefined) return <NoDb />;
  if (!isNew && !row) notFound();
  return (
    <>
      <PageHead title={isNew ? "Add recording or performance" : "Edit"} />
      <ActionForm
        action={saveMusic}
        secondary={
          row ? (
            <ConfirmButton
              label="Delete"
              confirm="Move this item to the trash?"
              action={deleteMusic.bind(null, row.id)}
            />
          ) : undefined
        }
      >
        {row ? <F name="id" label="id" type="hidden" defaultValue={row.id} /> : null}
        <div className="adm-grid2">
          <F
            name="kind"
            label="Kind"
            type="select"
            options={[
              { value: "recording", label: "Recording" },
              { value: "performance", label: "Performance" },
            ]}
            defaultValue={row?.kind ?? "recording"}
          />
          <F name="title" label="Title" defaultValue={row?.title} required />
        </div>
        <div className="adm-grid2">
          <F name="date" label="Date" type="date" defaultValue={row?.date} />
          <F name="sort" label="Order" type="number" defaultValue={row?.sort ?? 0} min={0} />
        </div>
        <div className="adm-grid2">
          <F name="venue" label="Venue" defaultValue={row?.venue} />
          <F name="ensemble" label="Ensemble" defaultValue={row?.ensemble} hint="Credit collaborators by name." />
        </div>
        <F name="note" label="Note" type="textarea" rows={3} defaultValue={row?.note} />
        <div className="adm-grid2">
          <F name="provider" label="Player" type="select" options={providers} defaultValue={row?.provider ?? ""} />
          <F
            name="embedId"
            label="Link id"
            defaultValue={row?.embedId}
            hint="YouTube: the video id. Spotify: track/… . SoundCloud and Bandcamp: the URL."
          />
        </div>
        <F
          name="rights"
          label="Rights"
          type="select"
          options={rights}
          defaultValue={row?.rights ?? "original"}
          hint="Covers have separate licensing rights: link to the platform rather than hosting the recording."
        />
        <MediaPicker name="coverMediaId" label="Cover image" defaultValue={row?.coverMediaId} />
        <div className="adm-grid2">
          <F name="visible" label="Visible on the site" type="checkbox" defaultValue={row?.visible ?? true} />
          <F name="featured" label="Featured" type="checkbox" defaultValue={row?.featured ?? false} />
        </div>
        <F
          name="needsReview"
          label="Needs review (other performers or venues to ask first)"
          type="checkbox"
          defaultValue={row?.needsReview ?? false}
        />
      </ActionForm>
    </>
  );
}
