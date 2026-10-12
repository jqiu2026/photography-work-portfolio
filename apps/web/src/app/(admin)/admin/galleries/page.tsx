import { schema } from "@jerryqiu/db";
import { Badge, Button } from "@halation/ui";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import NextLink from "next/link";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";

export const metadata = { title: "Galleries" };

export default async function GalleriesPage() {
  const rows = await withDb(async (db) => {
    const gs = await db
      .select()
      .from(schema.galleries)
      .where(and(isNull(schema.galleries.deletedAt), eq(schema.galleries.site, "photos")))
      .orderBy(asc(schema.galleries.sort), asc(schema.galleries.title));
    const counts = await db
      .select({ galleryId: schema.galleryItems.galleryId, n: count() })
      .from(schema.galleryItems)
      .groupBy(schema.galleryItems.galleryId);
    return gs.map((g) => ({ ...g, n: counts.find((c) => c.galleryId === g.id)?.n ?? 0 }));
  });
  if (!rows) return <NoDb />;
  return (
    <>
      <PageHead
        title="Galleries"
        lede="Curated sets shown on the photography site's portfolio. Pick a protection level per gallery."
        actions={
          <Button as={NextLink} href="/admin/galleries/new">
            New gallery
          </Button>
        }
      />
      <table className="adm-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Images</th>
            <th>Protection</th>
            <th>Visible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id}>
              <td>
                <NextLink href={`/admin/galleries/${g.id}`}>{g.title}</NextLink>
              </td>
              <td>{g.category ?? "—"}</td>
              <td>{g.n}</td>
              <td>
                <Badge tone={g.protection === "strict" ? "accent" : "default"}>{g.protection}</Badge>
              </td>
              <td>{g.visible ? "Yes" : "Hidden"}</td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={5} className="adm-note">
                No galleries yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}
