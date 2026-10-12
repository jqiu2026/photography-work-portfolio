import { schema } from "@jerryqiu/db";
import { Button } from "@placeholder/ui";
import { and, desc, eq } from "drizzle-orm";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/form-kit";
import { PostForm, type PostValues } from "@/components/admin/PostForm";
import { getAdminSite } from "@/components/admin/site";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { restoreVersion } from "../actions";

const localInput = (d: Date | null) =>
  d ? new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await getAdminSite();
  const isNew = id === "new";
  const data = isNew
    ? null
    : await withDb(async (db) => {
        const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
        const versions = post
          ? await db
              .select()
              .from(schema.postVersions)
              .where(eq(schema.postVersions.postId, id))
              .orderBy(desc(schema.postVersions.version))
              .limit(20)
          : [];
        return { post, versions };
      });
  if (!isNew && data === undefined) return <NoDb />;
  if (!isNew && !data?.post) notFound();
  const p = data?.post;
  const values: PostValues = {
    id: p?.id,
    site: p?.site ?? site,
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    subtitle: p?.subtitle ?? "",
    summary: p?.summary ?? "",
    body: p?.body ?? "",
    tags: p?.tags ?? [],
    status: p?.status ?? "draft",
    publishAt: localInput(p?.publishAt ?? null),
    featured: p?.featured ?? false,
    coverMediaId: p?.coverMediaId ?? null,
    seoTitle: p?.seo?.title ?? "",
    seoDescription: p?.seo?.description ?? "",
  };
  return (
    <>
      <PageHead
        title={isNew ? "New post" : "Edit post"}
        lede={p?.deletedAt ? "This post is in the trash." : undefined}
        actions={
          p ? (
            <>
              <Button as={NextLink} href={`/admin/preview/posts/${p.id}`} variant="ghost" size="sm">
                Preview
              </Button>
              {p.status === "published" ? (
                <Button as="a" href={`/writing/${p.slug}`} variant="ghost" size="sm">
                  View live
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      />
      <PostForm values={values} />
      {data?.versions.length ? (
        <section style={{ marginTop: "3rem" }} aria-labelledby="hist">
          <h2 id="hist" style={{ fontSize: "var(--ph-text-xl)", marginBottom: "0.75rem" }}>
            Version history
          </h2>
          <table className="adm-table">
            <tbody>
              {data.versions.map((v) => (
                <tr key={v.id}>
                  <td>Version {v.version}</td>
                  <td className="adm-note">{v.createdAt.toLocaleString()}</td>
                  <td className="adm-note">{v.createdBy}</td>
                  <td>
                    <ConfirmButton
                      label="Restore"
                      confirm={`Restore version ${v.version}? It becomes the current draft; nothing is lost (a new version is recorded when you save).`}
                      action={restoreVersion.bind(null, id, v.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}
