import { schema } from "@jerryqiu/db";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import NextLink from "next/link";
import { Uploader } from "@/components/admin/Uploader";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";

export const metadata = { title: "Media" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const sp = await searchParams;
  const rows = await withDb((db) =>
    db
      .select()
      .from(schema.media)
      .where(
        and(
          isNull(schema.media.deletedAt),
          eq(schema.media.kind, "image"),
          sp.filter === "review" ? eq(schema.media.reviewStatus, "needs_review") : undefined,
          sp.q ? ilike(schema.media.filename, `%${sp.q.replace(/[%_]/g, "")}%`) : undefined,
        ),
      )
      .orderBy(desc(schema.media.createdAt))
      .limit(300),
  );
  if (!rows) return <NoDb />;
  const tab = (label: string, filter?: string) => (
    <NextLink
      key={label}
      href={filter ? `/admin/media?filter=${filter}` : "/admin/media"}
      className="adm-tab"
      aria-current={sp.filter === filter || (!sp.filter && !filter) ? "page" : undefined}
    >
      {label}
    </NextLink>
  );
  return (
    <>
      <PageHead
        title="Media"
        lede="Every image used on the sites. Originals are private; the sites only ever show downsized copies with location data removed."
      />
      <Uploader />
      <nav aria-label="Filter" style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
        {[tab("All"), tab("Needs review", "review")]}
      </nav>
      <ul className="adm-media">
        {rows.map((m) => (
          <li key={m.id}>
            <NextLink href={`/admin/media/${m.id}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/admin/media/${m.id}/file?w=480`} alt={m.alt ?? ""} loading="lazy" />
              {m.reviewStatus === "needs_review" ? <span className="flag">needs review</span> : null}
              <span>{m.filename}</span>
            </NextLink>
          </li>
        ))}
      </ul>
      {!rows.length ? (
        <p className="adm-note" style={{ marginTop: "2rem" }}>
          No images yet. Drop some above.
        </p>
      ) : null}
    </>
  );
}
