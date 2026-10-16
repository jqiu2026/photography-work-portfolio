import { schema } from "@jerryqiu/db";
import * as portal from "@jerryqiu/db/portal";
import Link from "next/link";
import { PortalFrame } from "@/components/portal/PortalFrame";
import { portalRef } from "@/lib/portal-links";
import { STEP_LABEL, requireAccount } from "@/lib/portal-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your portal", robots: { index: false, follow: false } };

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const day = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

/** Everything the client needs to do next, then their jobs, galleries and upcoming appointments. */
export default async function PortalHome() {
  const { me, db, unread } = await requireAccount();
  const o = await portal.clientOverview(db, me.client.id);
  const acct = me.account.id;
  const jobTitle = new Map(o.jobs.map((j) => [j.id, j.title]));
  const todo: { key: string; text: string; href: string; cta: string }[] = [];
  for (const i of o.invoices.filter((x) => x.status === "sent" || x.status === "viewed" || x.status === "partial"))
    todo.push({
      key: `i${i.id}`,
      text: `Invoice ${i.number} (${usd(i.totalCents)})${i.dueDate ? ` due ${i.dueDate}` : ""}`,
      href: `/client/pay/${portalRef("invoice", i.id, acct)}`,
      cta: "Pay",
    });
  for (const k of o.contracts.filter((x) => x.status === "sent" || x.status === "viewed"))
    todo.push({
      key: `k${k.id}`,
      text: `Sign: ${k.title}`,
      href: `/client/sign/${portalRef("contract", k.id, acct)}`,
      cta: "Read and sign",
    });
  for (const q of o.sends.filter((x) => !x.completedAt))
    todo.push({
      key: `q${q.id}`,
      text: `Questions: ${q.title}`,
      href: `/client/questionnaire/${portalRef("questionnaire", q.id, acct)}`,
      cta: "Answer",
    });
  for (const q of o.quotes.filter((x) => x.status === "sent" || x.status === "viewed"))
    todo.push({
      key: `z${q.id}`,
      text: `Quote ${q.number}: ${q.title} (${usd(q.totalCents)})`,
      href: `/client/quote/${portalRef("quote", q.id, acct)}`,
      cta: "Review",
    });
  const galleries = o.galleries.filter((g) => g.status === "published" && (!g.expiresAt || g.expiresAt > new Date()));
  return (
    <PortalFrame current="home" name={me.client.name} unread={unread}>
      <section className="st-card" aria-labelledby="p-todo">
        <h2 id="p-todo">What needs you</h2>
        {todo.length ? (
          <ul className="st-list">
            {todo.map((t) => (
              <li key={t.key}>
                <span>{t.text}</span>
                <Link className="st-btn" href={t.href}>
                  {t.cta}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">Nothing right now.</p>
        )}
      </section>
      <div className="st-grid" style={{ marginTop: "1.5rem" }}>
        <section className="st-card" aria-labelledby="p-jobs">
          <h2 id="p-jobs">Your jobs</h2>
          {o.jobs.length ? (
            <ul className="st-list">
              {o.jobs.map((j) => (
                <li key={j.id}>
                  <span>
                    <strong>{j.title}</strong>
                    <small>
                      {STEP_LABEL[j.status] ?? j.status}
                      {j.deliveryEta && j.status !== "delivered" && j.status !== "paid"
                        ? ` · estimated delivery ${j.deliveryEta}`
                        : ""}
                    </small>
                  </span>
                  <Link className="st-btn st-btn--ghost" href={`/client/jobs/${j.id}`}>
                    Details
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">No jobs yet.</p>
          )}
        </section>
        <section className="st-card" aria-labelledby="p-gal">
          <h2 id="p-gal">Galleries</h2>
          {galleries.length ? (
            <ul className="st-list">
              {galleries.map((g) => (
                <li key={g.id}>
                  <span>
                    <strong>{g.title}</strong>
                    <small>
                      {jobTitle.get(g.jobId)}
                      {g.expiresAt ? ` · available until ${day(g.expiresAt)}` : ""}
                    </small>
                  </span>
                  <Link className="st-btn" href={`/client/galleries/${g.id}`}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">No galleries yet.</p>
          )}
        </section>
        <section className="st-card" aria-labelledby="p-appt">
          <h2 id="p-appt">Coming up</h2>
          {o.appointments.length ? (
            <ul className="st-list">
              {o.appointments.map((a) => (
                <li key={a.id}>
                  <span>
                    <strong>{a.title}</strong>
                    <small>
                      {a.startsAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                      {a.location ? ` · ${a.location}` : ""}
                    </small>
                  </span>
                  {a.jobId ? (
                    <Link className="st-btn st-btn--ghost" href={`/client/jobs/${a.jobId}`}>
                      Change
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">Nothing scheduled.</p>
          )}
        </section>
      </div>
    </PortalFrame>
  );
}
void schema;
