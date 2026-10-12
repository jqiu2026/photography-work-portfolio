import { schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton, F } from "@/components/admin/form-kit";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { deleteFlight, saveFlight } from "../actions";

export default async function EditFlight({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const row = isNew
    ? null
    : await withDb(
        async (db) => (await db.select().from(schema.flightEntries).where(eq(schema.flightEntries.id, id)).limit(1))[0],
      );
  if (!isNew && row === undefined) return <NoDb />;
  if (!isNew && !row) notFound();
  const checked = Boolean(row?.safeToPublish);
  return (
    <>
      <PageHead title={isNew ? "Add flying entry" : "Edit entry"} />
      <ActionForm
        action={saveFlight}
        secondary={
          row ? (
            <ConfirmButton
              label="Delete"
              confirm="Move this entry to the trash?"
              action={deleteFlight.bind(null, row.id)}
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
              { value: "milestone", label: "Milestone" },
              { value: "flight", label: "Memorable flight" },
            ]}
            defaultValue={row?.kind ?? "milestone"}
          />
          <F name="title" label="Title" defaultValue={row?.title} required />
        </div>
        <div className="adm-grid2">
          <F name="date" label="Date" type="date" defaultValue={row?.date} />
          <F name="aircraft" label="Aircraft" defaultValue={row?.aircraft} />
        </div>
        <F
          name="story"
          label="The story"
          type="textarea"
          rows={6}
          defaultValue={row?.story}
          hint="Plain, specific, and about what you learned."
        />
        <MediaPicker name="photoMediaId" label="Photo" defaultValue={row?.photoMediaId} />
        <fieldset
          style={{
            border: "1px solid var(--hl-line)",
            borderRadius: 4,
            padding: "1rem",
            display: "grid",
            gap: "0.75rem",
          }}
        >
          <legend style={{ padding: "0 0.4rem" }}>Safe to publish checklist</legend>
          <F
            name="ackLocation"
            label="This does not reveal where I am or will be right now (no real-time location)."
            type="checkbox"
            defaultValue={checked}
          />
          <F
            name="ackDetails"
            label="I have decided on purpose whether to include tail numbers and exact times."
            type="checkbox"
            defaultValue={checked}
          />
          <F
            name="ackPeople"
            label="Nobody identifiable appears without their permission."
            type="checkbox"
            defaultValue={checked}
          />
        </fieldset>
        <div className="adm-grid2">
          <F
            name="visible"
            label="Visible on the site"
            type="checkbox"
            defaultValue={row?.visible ?? false}
            hint="Only possible once the checklist is complete."
          />
          <F name="sort" label="Order" type="number" defaultValue={row?.sort ?? 0} min={0} />
        </div>
      </ActionForm>
    </>
  );
}
