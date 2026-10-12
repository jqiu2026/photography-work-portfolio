import { schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PostView } from "@/components/site/PostView";
import { withDb } from "@/lib/admin-db";
import "@/components/site/post.css";

export const metadata = { title: "Preview" };

/** Draft preview: the exact article layout, for signed-in staff only (the admin layout enforces the session). */
export default async function PreviewPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await withDb(
    async (db) => (await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1))[0],
  );
  if (!post) notFound();
  return (
    <>
      <p
        role="status"
        style={{
          background: "var(--ph-yellow)",
          color: "#0a0a0a",
          padding: "0.6rem 1rem",
          margin: "-1rem -1rem 1rem",
          fontSize: "var(--ph-text-sm)",
        }}
      >
        Preview. This is how “{post.title}” will look ({post.status}). It is not public unless published.
      </p>
      <PostView
        post={{
          title: post.title,
          subtitle: post.subtitle,
          body: post.body,
          publishedAt: post.publishAt,
          author: "Jerry Qiu",
        }}
      />
    </>
  );
}
