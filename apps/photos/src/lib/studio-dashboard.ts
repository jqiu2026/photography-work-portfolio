import type { Database } from "@jerryqiu/db";
import * as autoDb from "@jerryqiu/db/automation";
import * as bill from "@jerryqiu/db/billing";
import * as cal from "@jerryqiu/db/calendar";
import * as st from "@jerryqiu/db/studio";

const DAY = 86_400_000;

export type DashboardData = {
  revenue: { days: { label: string; cents: number }[]; totalCents: number; previousCents: number };
  stats: {
    upcoming: number;
    activeClients: number;
    deliveries: number;
    newInquiries: number;
    unpaidCents: number;
    unpaidCount: number;
  };
  upcoming: { id: string; title: string; when: string; location: string | null }[];
  activity: { id: string; kind: string; title: string; body: string | null; link: string | null; at: string }[];
  galleries: { id: string; title: string; status: string; jobTitle: string }[];
  tasks: { id: string; title: string; dueOn: string | null }[];
};

/** Everything the studio dashboard shows, from real rows only (nothing invented). */
export async function dashboardData(db: Database, now = new Date()): Promise<DashboardData> {
  const [payments, jobs, invoices, galleries, bookings, appts, notes, tasks] = await Promise.all([
    bill.listPayments(db),
    st.listJobs(db),
    st.listInvoices(db),
    st.listGalleries(db),
    st.listBookings(db),
    cal.listAppointments(db, now, new Date(now.getTime() + 21 * DAY)),
    autoDb.listNotifications(db, 8),
    autoDb.listTasks(db),
  ]);

  const start = new Date(now.getTime() - 29 * DAY);
  start.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY);
    return {
      key: d.toDateString(),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cents: 0,
    };
  });
  let previousCents = 0;
  for (const { payment } of payments) {
    if (payment.status !== "succeeded") continue;
    const at = payment.paidAt ?? payment.createdAt;
    const net = payment.amountCents - payment.refundedCents;
    const b = buckets.find((x) => x.key === at.toDateString());
    if (b) b.cents += net;
    else if (at.getTime() < start.getTime() && at.getTime() >= start.getTime() - 30 * DAY) previousCents += net;
  }

  // what clients owe: sent invoices only (drafts were never sent), less what part-paid ones already received
  const unpaid = invoices.filter((i) => ["sent", "viewed", "partial"].includes(i.invoice.status));
  const owed = await Promise.all(
    unpaid.map(async (i) =>
      i.invoice.status === "partial"
        ? i.invoice.totalCents - (await st.invoiceNetCents(db, i.invoice.id))
        : i.invoice.totalCents,
    ),
  );
  const openJobs = jobs.filter((j) => j.job.status !== "paid" && j.job.status !== "cancelled");
  return {
    revenue: {
      days: buckets.map(({ label, cents }) => ({ label, cents })),
      totalCents: buckets.reduce((a, b) => a + b.cents, 0),
      previousCents,
    },
    stats: {
      upcoming: appts.length,
      activeClients: new Set(openJobs.map((j) => j.client.id)).size,
      deliveries: galleries.filter((g) => g.gallery.status === "published" && !g.gallery.deliveredAt).length,
      newInquiries: bookings.filter((b) => b.status === "new").length,
      unpaidCents: owed.reduce((a, c) => a + c, 0),
      unpaidCount: unpaid.length,
    },
    upcoming: appts.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title,
      when: a.startsAt.toISOString(),
      location: a.location,
    })),
    activity: notes.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      link: n.link,
      at: n.createdAt.toISOString(),
    })),
    galleries: galleries
      .slice(0, 4)
      .map((g) => ({ id: g.gallery.id, title: g.gallery.title, status: g.gallery.status, jobTitle: g.job.title })),
    tasks: tasks
      .filter((t) => !t.doneAt)
      .slice(0, 5)
      .map((t) => ({ id: t.id, title: t.title, dueOn: t.dueOn })),
  };
}
