import { schema } from "@jerryqiu/db";
import { and, desc, eq, lt } from "drizzle-orm";
import NextLink from "next/link";
import { requirePageUser } from "@/auth";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";

export const metadata = { title: "Audit log" };
const PAGE = 50;

export default async function AuditPage({
  searchParams,
}: { searchParams: Promise<{ before?: string; entity?: string }> }) {
  await requirePageUser("audit.read", "/admin/audit");
  const { before, entity } = await searchParams;
  const cursor = Number(before);
  const rows = await withDb((db) =>
    db
      .select()
      .from(schema.auditLog)
      .where(
        and(
          Number.isInteger(cursor) && cursor > 0 ? lt(schema.auditLog.id, cursor) : undefined,
          entity && /^[a-z_]{1,40}$/.test(entity) ? eq(schema.auditLog.entity, entity) : undefined,
        ),
      )
      .orderBy(desc(schema.auditLog.id))
      .limit(PAGE + 1),
  );
  if (!rows) return <NoDb />;
  const more = rows.length > PAGE;
  const shown = rows.slice(0, PAGE);
  const q = entity ? `&entity=${encodeURIComponent(entity)}` : "";
  return (
    <>
      <PageHead title="Audit log" lede="Who changed what, and when. Entries cannot be edited here." />
      <table className="adm-table">
        <thead>
          <tr>
            <th>When (UTC)</th>
            <th>Who</th>
            <th>What</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((a) => (
            <tr key={a.id}>
              <td>{a.at.toISOString().slice(0, 16).replace("T", " ")}</td>
              <td>{a.actor}</td>
              <td>
                <NextLink href={`/admin/audit?entity=${a.entity}`}>{a.action}</NextLink>
              </td>
              <td>{a.summary}</td>
            </tr>
          ))}
          {!shown.length ? (
            <tr>
              <td colSpan={4} className="adm-note">
                Nothing recorded yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {entity ? (
        <p>
          <NextLink href="/admin/audit">Clear filter ({entity})</NextLink>
        </p>
      ) : null}
      {more ? (
        <p>
          <NextLink href={`/admin/audit?before=${shown[shown.length - 1].id}${q}`}>Older entries</NextLink>
        </p>
      ) : null}
    </>
  );
}
