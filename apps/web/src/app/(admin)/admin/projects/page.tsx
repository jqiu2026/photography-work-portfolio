import { Badge, Button } from "@/components/kit";
import { schema } from "@jerryqiu/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import NextLink from "next/link";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const rows = await withDb((db) =>
    db
      .select()
      .from(schema.projects)
      .where(and(isNull(schema.projects.deletedAt), eq(schema.projects.site, "photos")))
      .orderBy(desc(schema.projects.sort), desc(schema.projects.date)),
  );
  if (!rows) return <NoDb />;
  return (
    <>
      <PageHead
        title="Projects"
        lede="Case studies: the photography and video projects shown on the photography site under Work."
        actions={
          <Button as={NextLink} href="/admin/projects/new">
            New project
          </Button>
        }
      />
      <table className="adm-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <NextLink href={`/admin/projects/${p.id}`}>{p.title}</NextLink>
                {p.protectedPage ? <span className="adm-note"> · protected</span> : null}
              </td>
              <td>{p.type}</td>
              <td>
                <Badge tone={p.status === "published" ? "success" : "default"}>{p.status}</Badge>
              </td>
              <td className="adm-note">{p.date ?? "—"}</td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={4} className="adm-note">
                No projects yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}
