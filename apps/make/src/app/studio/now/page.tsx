import * as mk from "@jerryqiu/db/make";
import { addNowAction, removeNowAction } from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Field, Textarea } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function NowLog() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const now = await mk.listNow(db, 100);
  return (
    <>
      <StudioHead title="Now log" />
      <section className="st-card">
        <h2>Add a line</h2>
        <ActionForm action={addNowAction} submit="Log it" reset>
          <Field label="What are you working on?" hint="One or two sentences. It shows on the site with today's date.">
            <Textarea name="body" rows={3} required minLength={3} maxLength={600} />
          </Field>
        </ActionForm>
      </section>
      <section className="st-card">
        <h2>Logged</h2>
        {now.length ? (
          now.map((n) => (
            <div key={n.id} className="st-rowline">
              <span>
                {n.body} <span className="mk-mono">{n.createdAt.toISOString().slice(0, 10)}</span>
              </span>
              <ActionForm action={removeNowAction} submit="Remove" variant="ghost" inline>
                <input type="hidden" name="id" value={n.id} />
              </ActionForm>
            </div>
          ))
        ) : (
          <p className="mk-muted">Nothing yet.</p>
        )}
      </section>
    </>
  );
}
