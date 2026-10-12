import { schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton, F } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { deleteTimeline, saveTimeline } from "../actions";

const categories = ["work", "education", "leadership", "volunteering", "flying", "music", "photography", "other"].map(
  (v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }),
);

export default async function EditTimeline({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const row = isNew
    ? null
    : await withDb(
        async (db) =>
          (await db.select().from(schema.timelineEntries).where(eq(schema.timelineEntries.id, id)).limit(1))[0],
      );
  if (!isNew && row === undefined) return <NoDb />;
  if (!isNew && !row) notFound();
  return (
    <>
      <PageHead title={isNew ? "Add timeline entry" : "Edit entry"} />
      <ActionForm
        action={saveTimeline}
        secondary={
          row ? (
            <ConfirmButton
              label="Delete"
              confirm="Move this entry to the trash?"
              action={deleteTimeline.bind(null, row.id)}
            />
          ) : undefined
        }
      >
        {row ? <F name="id" label="id" type="hidden" defaultValue={row.id} /> : null}
        <div className="adm-grid2">
          <F name="title" label="Title" defaultValue={row?.title} required />
          <F name="org" label="Organisation" defaultValue={row?.org} />
        </div>
        <div className="adm-grid2">
          <F
            name="category"
            label="Category"
            type="select"
            options={categories}
            defaultValue={row?.category ?? "other"}
          />
          <F
            name="sort"
            label="Order"
            type="number"
            defaultValue={row?.sort ?? 0}
            min={0}
            hint="Lower numbers first."
          />
        </div>
        <div className="adm-grid2">
          <F name="startDate" label="Start" type="date" defaultValue={row?.startDate} />
          <F name="endDate" label="End" type="date" defaultValue={row?.endDate} />
        </div>
        <F
          name="summary"
          label="What happened"
          type="textarea"
          rows={4}
          defaultValue={row?.summary}
          hint="Plain, specific, credit others by name. No superlatives."
        />
        <F name="link" label="Link" type="url" defaultValue={row?.link} />
        <div className="adm-grid2">
          <F name="current" label="Ongoing (show “present”)" type="checkbox" defaultValue={row?.current ?? false} />
          <F name="visible" label="Visible on the site" type="checkbox" defaultValue={row?.visible ?? true} />
        </div>
      </ActionForm>
    </>
  );
}
