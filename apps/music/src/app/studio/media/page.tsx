import * as m from "@jerryqiu/db/music";
import { removeMediaAction } from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { MediaForm } from "@/components/studio/MediaForm";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Tag } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Media() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const [items, works] = await Promise.all([m.listMediaItems(db), m.listWorksAdmin(db)]);
  return (
    <>
      <StudioHead title="Recordings and performances" />
      <section className="st-card">
        <h2>All items</h2>
        {items.length ? (
          items.map((i) => (
            <div key={i.id} className="st-rowline">
              <span>
                <Tag>{i.kind}</Tag> {i.title}{" "}
                <span className="mu-muted">
                  {[works.find((w) => w.id === i.workId)?.title, i.provider, i.date, i.venue]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <ActionForm action={removeMediaAction} submit="Remove" variant="ghost" inline>
                <input type="hidden" name="id" value={i.id} />
              </ActionForm>
            </div>
          ))
        ) : (
          <p className="mu-muted">Nothing yet.</p>
        )}
      </section>
      <section className="st-card">
        <h2>Add one</h2>
        <MediaForm works={works.map((w) => ({ id: w.id, title: w.title }))} />
      </section>
    </>
  );
}
