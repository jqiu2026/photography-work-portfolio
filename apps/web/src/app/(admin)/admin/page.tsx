import { schema } from "@jerryqiu/db";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import NextLink from "next/link";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { currentUser } from "@/auth";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const sp = await searchParams;
  const user = await currentUser();
  const data = await withDb(async (db) => {
    const live = (t: { deletedAt: unknown }) => isNull(t.deletedAt as never);
    const [posts, drafts, projects, galleries, inbox, review, media, trash] = await Promise.all([
      db
        .select({ n: count() })
        .from(schema.posts)
        .where(and(live(schema.posts), eq(schema.posts.status, "published"))),
      db
        .select({ n: count() })
        .from(schema.posts)
        .where(and(live(schema.posts), eq(schema.posts.status, "draft"))),
      db.select({ n: count() }).from(schema.projects).where(live(schema.projects)),
      db.select({ n: count() }).from(schema.galleries).where(live(schema.galleries)),
      db
        .select({ n: count() })
        .from(schema.inboxMessages)
        .where(and(isNull(schema.inboxMessages.deletedAt), eq(schema.inboxMessages.status, "new"))),
      db
        .select({ n: count() })
        .from(schema.media)
        .where(and(live(schema.media), eq(schema.media.reviewStatus, "needs_review"))),
      db.select({ n: count() }).from(schema.media).where(live(schema.media)),
      db.select({ n: count() }).from(schema.posts).where(eq(schema.posts.status, "draft")),
    ]);
    const recent = await db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.at)).limit(6);
    return {
      posts: posts[0].n,
      drafts: drafts[0].n,
      projects: projects[0].n,
      galleries: galleries[0].n,
      inbox: inbox[0].n,
      review: review[0].n,
      media: media[0].n,
      trash: trash[0].n,
      recent,
    };
  });
  const cards: [string, string, number | string, string][] = data
    ? [
        ["Posts", "/admin/posts", data.posts, `${data.drafts} draft`],
        ["Projects", "/admin/projects", data.projects, "case studies on photography"],
        ["Galleries", "/admin/galleries", data.galleries, "photography portfolio"],
        ["Media", "/admin/media", data.media, `${data.review} need review`],
        ["Inbox", "/admin/inbox", data.inbox, "new messages"],
      ]
    : [];
  return (
    <>
      <PageHead
        title={`Hello${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        lede="Everything on all four sites is managed here. Pick a site at the top of the sidebar to scope the sections."
      />
      {sp.denied ? (
        <p role="alert" className="adm-bad" style={{ marginBottom: "1rem" }}>
          Your role doesn't allow that section.
        </p>
      ) : null}
      {!data ? (
        <NoDb />
      ) : (
        <>
          <div className="adm-cards">
            {cards.map(([t, href, n, note]) => (
              <NextLink key={t} href={href} className="adm-card">
                <h2>{t}</h2>
                <span className="n">{n}</span>
                <p>{note}</p>
              </NextLink>
            ))}
          </div>
          <h2 style={{ margin: "2.5rem 0 0.75rem", fontSize: "var(--ph-text-xl)" }}>Recent activity</h2>
          {data.recent.length ? (
            <table className="adm-table">
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.id}>
                    <td>{r.summary ?? `${r.action} ${r.entity}`}</td>
                    <td className="adm-note">{r.actor}</td>
                    <td className="adm-note">{r.at.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="adm-note">Nothing yet. Changes are recorded in the audit log.</p>
          )}
        </>
      )}
    </>
  );
}
