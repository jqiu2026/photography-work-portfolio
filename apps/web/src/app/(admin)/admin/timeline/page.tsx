import { schema } from "@jerryqiu/db";
import { asc, desc, isNull } from "drizzle-orm";
import { Button } from "@halation/ui";
import NextLink from "next/link";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";

export const metadata = { title: "Timeline" };

export default async function TimelinePage() {
  const rows = await withDb((db) =>
    db
      .select()
      .from(schema.timelineEntries)
      .where(isNull(schema.timelineEntries.deletedAt))
      .orderBy(asc(schema.timelineEntries.sort), desc(schema.timelineEntries.startDate)),
  );
  if (!rows) return <NoDb />;
  return (
    <>
      <PageHead
        title="Timeline"
        lede="Work, school, leadership, flying, music. Powers the About page and, later, the résumé."
        actions={
          <Button as={NextLink} href="/admin/timeline/new">
            Add entry
          </Button>
        }
      />
      <table className="adm-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Dates</th>
            <th>Visible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <NextLink href={`/admin/timeline/${r.id}`}>{r.title}</NextLink>
                {r.org ? <span className="adm-note"> · {r.org}</span> : null}
              </td>
              <td>{r.category}</td>
              <td className="adm-note">
                {[r.startDate, r.current ? "present" : r.endDate].filter(Boolean).join(" → ") || "—"}
              </td>
              <td>{r.visible ? "Yes" : "Hidden"}</td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={4} className="adm-note">
                No entries yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}
