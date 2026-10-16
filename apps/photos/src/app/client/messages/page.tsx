import { schema } from "@jerryqiu/db";
import * as portal from "@jerryqiu/db/portal";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { MessageForm } from "@/components/portal/PortalForms";
import { PortalFrame } from "@/components/portal/PortalFrame";
import { requireAccount } from "@/lib/portal-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages", robots: { index: false, follow: false } };

const HIDDEN = ["magic-link", "password-reset", "portal-invite"];

/** The whole conversation: messages typed in the portal and every email the studio sent to this client. */
export default async function PortalMessages() {
  const { me, db } = await requireAccount();
  await portal.markRead(db, me.client.id, "out");
  const [messages, emails, jobs] = await Promise.all([
    portal.listMessages(db, me.client.id),
    db
      .select()
      .from(schema.emailLog)
      .where(and(eq(schema.emailLog.toEmail, me.client.email.toLowerCase()), notInArray(schema.emailLog.kind, HIDDEN)))
      .orderBy(desc(schema.emailLog.createdAt))
      .limit(50),
    db
      .select({ id: schema.studioJobs.id, title: schema.studioJobs.title })
      .from(schema.studioJobs)
      .where(eq(schema.studioJobs.clientId, me.client.id)),
  ]);
  const thread = [
    ...messages.map((m) => ({
      key: `m${m.id}`,
      at: m.createdAt,
      from: m.direction === "in" ? "You" : "Studio",
      subject: null as string | null,
      body: m.body,
    })),
    ...emails.map((e) => ({
      key: `e${e.id}`,
      at: e.createdAt,
      from: "Studio (email)",
      subject: e.subject,
      body: e.bodyText,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  return (
    <PortalFrame current="messages" name={me.client.name} unread={0}>
      <section className="st-card" aria-labelledby="m-thread">
        <h1 className="st-title" id="m-thread">
          Messages
        </h1>
        {thread.length ? (
          <ul className="st-list st-list--tall" aria-label="Conversation">
            {thread.map((t) => (
              <li key={t.key} data-from={t.from}>
                <details open={!t.subject}>
                  <summary>
                    <strong>{t.from}</strong> · {t.at.toISOString().slice(0, 16).replace("T", " ")}
                    {t.subject ? ` · ${t.subject}` : ""}
                  </summary>
                  <pre className="st-pre">{t.body}</pre>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No messages yet.</p>
        )}
      </section>
      <section className="st-card" style={{ marginTop: "1.5rem" }} aria-labelledby="m-new">
        <h2 id="m-new">Write to me</h2>
        <MessageForm jobs={jobs} />
      </section>
    </PortalFrame>
  );
}
