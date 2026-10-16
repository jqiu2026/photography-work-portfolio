import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { notify } from "@jerryqiu/db/automation";
import * as cal from "@jerryqiu/db/calendar";
import { eq } from "drizzle-orm";
import { afterShopPayment } from "@/lib/shop-fulfil";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** After a payment is recorded: a receipt email, and a booking confirmation when the invoice held an appointment. */
export async function afterPayment(db: Database, invoiceId: string) {
  const [inv] = await db.select().from(schema.studioInvoices).where(eq(schema.studioInvoices.id, invoiceId));
  if (!inv) return;
  const [row] = await db
    .select({ client: schema.studioClients, job: schema.studioJobs })
    .from(schema.studioJobs)
    .innerJoin(schema.studioClients, eq(schema.studioClients.id, schema.studioJobs.clientId))
    .where(eq(schema.studioJobs.id, inv.jobId));
  if (!row) return;
  if (inv.kind === "shop") {
    // a shop order is not the client's invoice: the buyer gets their own email and the studio an order notice
    await afterShopPayment(db, invoiceId);
    return;
  }
  await notify(db, {
    kind: "payment",
    title: `Payment received: ${inv.number}`,
    body: `${row.client.name}, ${usd(inv.totalCents)}`,
    link: "/studio/billing",
  });
  const related = { type: "invoice", id: inv.id };
  if (inv.status === "paid")
    await sendTemplate(
      db,
      row.client.email,
      "payment-receipt",
      {
        name: row.client.name,
        title: inv.number,
        amount: usd(inv.totalCents),
        detail: inv.lines.map((l) => l.description).join(", "),
      },
      { related },
    );
  const tz = (await cal.getCalendarSettings(db)).timezone;
  const [appt] = await db.select().from(schema.appointments).where(eq(schema.appointments.invoiceId, inv.id));
  if (appt && appt.status === "confirmed")
    await sendTemplate(
      db,
      row.client.email,
      "booking-confirmed",
      {
        name: row.client.name,
        title: appt.title,
        date: new Intl.DateTimeFormat("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "short" }).format(
          appt.startsAt,
        ),
        detail: "Your deposit is paid and the time is yours. Reply to this email if anything changes.",
        link: getSite("photos").url,
      },
      { related: { type: "appointment", id: appt.id } },
    );
}
