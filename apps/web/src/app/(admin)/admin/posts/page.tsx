import { Badge, Button } from "@/components/kit";
import { schema } from "@jerryqiu/db";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import NextLink from "next/link";
import { getAdminSite } from "@/components/admin/site";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";

export const metadata = { title: "Posts" };

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const site = await getAdminSite();
  const rows = await withDb((db) =>
    db
      .select()
      .from(schema.posts)
      .where(
        and(
          isNull(schema.posts.deletedAt),
          eq(schema.posts.site, site),
          sp.status && ["draft", "scheduled", "published"].includes(sp.status)
            ? eq(schema.posts.status, sp.status as "draft")
            : undefined,
          sp.q ? ilike(schema.posts.title, `%${sp.q}%`) : undefined,
        ),
      )
      .orderBy(desc(schema.posts.updatedAt))
      .limit(200),
  );
  if (!rows) return <NoDb />;
  const tab = (label: string, status?: string) => (
    <NextLink
      key={label}
      href={status ? `/admin/posts?status=${status}` : "/admin/posts"}
      aria-current={sp.status === status || (!sp.status && !status) ? "page" : undefined}
      className="adm-tab"
    >
      {label}
    </NextLink>
  );
  return (
    <>
      <PageHead
        title="Posts"
        lede="Writing on the hub (jerryqiu.com/writing)."
        actions={
          <Button as={NextLink} href="/admin/posts/new">
            New post
          </Button>
        }
      />
      <nav aria-label="Filter" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        {[tab("All"), tab("Drafts", "draft"), tab("Scheduled", "scheduled"), tab("Published", "published")]}
      </nav>
      <table className="adm-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Updated</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <NextLink href={`/admin/posts/${p.id}`}>{p.title}</NextLink>
                {p.featured ? <span className="adm-note"> · featured</span> : null}
              </td>
              <td>
                <Badge tone={p.status === "published" ? "success" : p.status === "scheduled" ? "accent" : "default"}>
                  {p.status}
                </Badge>
              </td>
              <td className="adm-note">{p.updatedAt.toLocaleString()}</td>
              <td className="adm-note">{p.updatedBy ?? "—"}</td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={4} className="adm-note">
                No posts here yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}
