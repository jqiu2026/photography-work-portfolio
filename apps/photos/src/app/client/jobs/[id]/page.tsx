import { schema } from "@jerryqiu/db";
import * as forms from "@jerryqiu/db/forms";
import * as portal from "@jerryqiu/db/portal";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentControls } from "@/components/portal/PortalForms";
import { PortalFrame } from "@/components/portal/PortalFrame";
import { portalRef } from "@/lib/portal-links";
import { STEPS, STEP_LABEL, requireAccount } from "@/lib/portal-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Job", robots: { index: false, follow: false } };

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** One job: where the photographs are (status and estimated delivery), and its documents, payments and appointments. */
export default async function PortalJob({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me, db, unread } = await requireAccount();
  const o = await portal.clientOverview(db, me.client.id);
  const job = o.jobs.find((j) => j.id === id);
  if (!job) notFound();
  const acct = me.account.id;
  const policies = await forms.getPolicies(db);
  const idx = STEPS.indexOf(job.status as (typeof STEPS)[number]);
  const invoices = o.invoices.filter((i) => i.jobId === id);
  const contracts = o.contracts.filter((c) => c.jobId === id);
  const galleries = o.galleries.filter((g) => g.jobId === id && g.status === "published");
  const appts = o.appointments.filter((a) => a.jobId === id);
  const minDate = new Date(Date.now() + policies.cancellationDays * 86_400_000).toISOString().slice(0, 10);
  return (
    <PortalFrame current="home" name={me.client.name} unread={unread}>
      <section className="st-card" aria-labelledby="j-title">
        <h1 className="st-title" id="j-title">
          {job.title}
        </h1>
        <ol className="st-steps" aria-label={`Progress: ${job.status}`}>
          {STEPS.map((s, i) => (
            <li key={s} data-done={i <= idx || undefined}>
              {STEP_LABEL[s]}
            </li>
          ))}
        </ol>
        <p className="st-note" role="status">
          {job.status === "cancelled"
            ? "This job was cancelled."
            : job.status === "delivered" || job.status === "paid"
              ? "Your photographs have been delivered."
              : job.status === "editing"
                ? `I'm editing your photographs${job.deliveryEta ? `. Estimated delivery: ${job.deliveryEta}.` : "."}`
                : job.status === "shot"
                  ? `The shoot is done and editing is next${job.deliveryEta ? `. Estimated delivery: ${job.deliveryEta}.` : "."}`
                  : job.deliveryEta
                    ? `Estimated delivery: ${job.deliveryEta}.`
                    : "I'll update this page as things move along."}
        </p>
      </section>
      <div className="st-grid" style={{ marginTop: "1.5rem" }}>
        <section className="st-card" aria-labelledby="j-doc">
          <h2 id="j-doc">Documents</h2>
          <ul className="st-list">
            {contracts.map((k) => (
              <li key={k.id}>
                <span>
                  {k.title} <small>{k.status}</small>
                </span>
                {k.status === "sent" || k.status === "viewed" ? (
                  <Link className="st-btn" href={`/client/sign/${portalRef("contract", k.id, acct)}`}>
                    Read and sign
                  </Link>
                ) : null}
              </li>
            ))}
            {invoices.map((i) => (
              <li key={i.id}>
                <span>
                  Invoice {i.number} · {usd(i.totalCents)} <small>{i.status}</small>
                </span>
                {i.status !== "draft" && i.status !== "void" ? (
                  <Link className="st-btn" href={`/client/pay/${portalRef("invoice", i.id, acct)}`}>
                    {i.status === "paid" ? "Receipt" : "Pay"}
                  </Link>
                ) : null}
              </li>
            ))}
            {!contracts.length && !invoices.length ? <li className="st-note">No documents yet.</li> : null}
          </ul>
        </section>
        <section className="st-card" aria-labelledby="j-gal">
          <h2 id="j-gal">Galleries</h2>
          {galleries.length ? (
            <ul className="st-list">
              {galleries.map((g) => (
                <li key={g.id}>
                  <span>{g.title}</span>
                  <Link className="st-btn" href={`/client/galleries/${g.id}`}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">Not ready yet.</p>
          )}
        </section>
        <section className="st-card" aria-labelledby="j-appt">
          <h2 id="j-appt">Appointments</h2>
          {appts.length ? (
            appts.map((a) => (
              <div key={a.id} style={{ marginBottom: "1rem" }}>
                <p>
                  <strong>{a.title}</strong>
                  <br />
                  <small>{a.startsAt.toISOString().slice(0, 16).replace("T", " ")} UTC</small>
                </p>
                {(a.startsAt.getTime() - Date.now()) / 3_600_000 >= policies.cancellationDays * 24 ? (
                  <AppointmentControls
                    id={a.id}
                    minutes={Math.round((a.endsAt.getTime() - a.startsAt.getTime()) / 60_000)}
                    minDate={minDate}
                  />
                ) : (
                  <p className="st-note">
                    This is inside the {policies.cancellationDays}-day window for changes.{" "}
                    <Link href="/client/messages">Message me</Link> and we will sort it out.
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="st-note">Nothing scheduled.</p>
          )}
        </section>
      </div>
    </PortalFrame>
  );
}
void schema;
