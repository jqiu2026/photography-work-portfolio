import * as m from "@jerryqiu/db/music";
import Link from "next/link";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Button, Tag } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Pieces() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const works = await m.listWorksAdmin(db);
  return (
    <>
      <StudioHead title="Pieces">
        <Button asChild>
          <Link href="/studio/pieces/new">New piece</Link>
        </Button>
      </StudioHead>
      <section className="st-card">
        {works.length ? (
          works.map((w) => (
            <div key={w.id} className="st-rowline">
              <Link className="mu-link" href={`/studio/pieces/${w.id}`}>
                {w.title}
              </Link>
              <span className="mu-row">
                <Tag tone={w.status === "published" ? "success" : "neutral"}>{w.status}</Tag>
                {w.rightsType === "arrangement-copyrighted" && !w.licenseOnFile ? (
                  <Tag tone="warning">license needed</Tag>
                ) : null}
                <span className="mu-muted">
                  {w.fileCount} files · {w.productCount} products
                </span>
              </span>
            </div>
          ))
        ) : (
          <p className="mu-muted">No pieces yet. Add the first one.</p>
        )}
      </section>
    </>
  );
}
