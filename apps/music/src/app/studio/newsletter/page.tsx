import * as m from "@jerryqiu/db/music";
import { sendNewsletterAction } from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { NoDb, Stat, StudioHead } from "@/components/studio/StudioBits";
import { Field, Input, Textarea } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Newsletter() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const subs = await m.listSubscribersAdmin(db);
  const confirmed = subs.filter((s) => s.confirmedAt && !s.unsubscribedAt);
  return (
    <>
      <StudioHead title="Newsletter" />
      <div className="st-stats">
        <Stat label="Confirmed" value={confirmed.length} />
        <Stat label="Waiting to confirm" value={subs.filter((s) => !s.confirmedAt && !s.unsubscribedAt).length} />
        <Stat label="Unsubscribed" value={subs.filter((s) => s.unsubscribedAt).length} />
      </div>
      <section className="st-card">
        <h2>Send a note</h2>
        <p className="mu-muted">
          Goes to the {confirmed.length} confirmed subscribers, each with their own unsubscribe link. Plain text; a
          blank line starts a new paragraph.
        </p>
        <ActionForm
          action={sendNewsletterAction}
          submit="Send"
          variant="primary"
          confirm="Send this to every confirmed subscriber? It cannot be recalled."
        >
          <Field label="Subject">
            <Input name="subject" required maxLength={150} />
          </Field>
          <Field label="Message">
            <Textarea name="body" rows={8} required />
          </Field>
          <Field label="Type the number of subscribers to confirm" hint={`${confirmed.length}`}>
            <Input name="confirmCount" inputMode="numeric" required style={{ width: "8rem" }} />
          </Field>
        </ActionForm>
      </section>
      <section className="st-card">
        <h2>Subscribers</h2>
        <p>
          <a className="mu-link" href="/studio/newsletter/export">
            Download the confirmed list (CSV)
          </a>
        </p>
        {confirmed.slice(0, 50).map((s) => (
          <div key={s.id} className="st-rowline">
            <span>{s.email}</span>
            <span className="mu-muted">{s.confirmedAt?.toISOString().slice(0, 10)}</span>
          </div>
        ))}
      </section>
    </>
  );
}
