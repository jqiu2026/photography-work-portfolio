import { Badge, Button } from "@/components/kit";
import { schema } from "@jerryqiu/db";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import NextLink from "next/link";
import { AircraftRow } from "@/components/admin/AircraftRow";
import { ActionForm, F } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { saveFlyingBackground } from "./actions";

export const metadata = { title: "Flight log" };

type Background = { story?: string; clubName?: string; clubNote?: string; clubUrl?: string; certificates?: string };

export default async function FlyingAdmin() {
  const data = await withDb(async (db) => {
    const entries = await db
      .select()
      .from(schema.flightEntries)
      .where(isNull(schema.flightEntries.deletedAt))
      .orderBy(asc(schema.flightEntries.sort), desc(schema.flightEntries.date));
    const aircraft = await db
      .select()
      .from(schema.aircraft)
      .where(isNull(schema.aircraft.deletedAt))
      .orderBy(asc(schema.aircraft.sort));
    const [bg] = await db
      .select()
      .from(schema.settings)
      .where(and(eq(schema.settings.site, "flying"), eq(schema.settings.key, "background")))
      .limit(1);
    return { entries, aircraft, bg: (bg?.value ?? {}) as Background };
  });
  if (!data) return <NoDb />;
  return (
    <>
      <PageHead
        title="Flying"
        lede="Milestones and memorable flights, aircraft, and your background. Empty fields are hidden publicly. Nothing about real-time location."
        actions={
          <Button as={NextLink} href="/admin/flying/new">
            Add entry
          </Button>
        }
      />
      <table className="adm-table">
        <thead>
          <tr>
            <th>Entry</th>
            <th>Kind</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.entries.map((e) => (
            <tr key={e.id}>
              <td>
                <NextLink href={`/admin/flying/${e.id}`}>{e.title}</NextLink>
              </td>
              <td>{e.kind}</td>
              <td className="adm-note">{e.date ?? "—"}</td>
              <td>
                {e.visible ? (
                  <Badge tone="success">visible</Badge>
                ) : (
                  <Badge>{e.safeToPublish ? "hidden" : "not cleared"}</Badge>
                )}
              </td>
            </tr>
          ))}
          {!data.entries.length ? (
            <tr>
              <td colSpan={4} className="adm-note">
                No entries yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <h2 style={{ margin: "3rem 0 1rem", fontSize: "var(--hm-text-2xl)", letterSpacing: "-0.03em" }}>Background</h2>
      <ActionForm action={saveFlyingBackground}>
        <F
          name="story"
          label="How flying started, in plain terms"
          type="textarea"
          rows={4}
          defaultValue={data.bg.story}
          hint="Leave empty to hide. Never invent hours, ratings or dates."
        />
        <F
          name="certificates"
          label="Certificates and ratings"
          type="textarea"
          rows={3}
          defaultValue={data.bg.certificates}
          hint="Only what you actually hold, and only if you want it public."
        />
        <div className="adm-grid2">
          <F name="clubName" label="Club or school" defaultValue={data.bg.clubName} />
          <F name="clubUrl" label="Club link" type="url" defaultValue={data.bg.clubUrl} />
        </div>
        <F name="clubNote" label="Club note" defaultValue={data.bg.clubNote} />
      </ActionForm>
      <h2 style={{ margin: "3rem 0 0.75rem", fontSize: "var(--hm-text-2xl)", letterSpacing: "-0.03em" }}>Aircraft</h2>
      <div style={{ display: "grid", gap: "1rem" }}>
        {data.aircraft.map((a) => (
          <AircraftRow key={a.id} row={a} />
        ))}
        <AircraftRow row={undefined} />
      </div>
    </>
  );
}
