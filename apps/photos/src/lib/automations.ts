import { publishScheduled } from "@/lib/gallery-publish";
import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import * as auto from "@jerryqiu/db/automation";
import * as cal from "@jerryqiu/db/calendar";
import * as gal from "@jerryqiu/db/galleries";
import * as shop from "@jerryqiu/db/gallery-shop";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";
import { runBillingJobs } from "@/lib/billing-jobs";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** What each rule says. Reminders link to the portal sign-in (it always works, by password or emailed link). */
function content(rule: auto.RuleKey, d: auto.Due, custom: string) {
  const base = getSite("photos").url;
  const portal = base;
  const note = custom.trim();
  const m: Record<auto.RuleKey, { title: string; summary: string; link: string; linkLabel: string }> = {
    "invoice-due": {
      title: `${d.title} is due soon`,
      summary: `${d.detail ?? ""}. You can pay online from your portal.`,
      link: portal,
      linkLabel: "Open my portal",
    },
    "invoice-overdue": {
      title: `${d.title} is overdue`,
      summary: `${d.detail ?? ""}. If you have already paid, thank you, and please ignore this. Otherwise you can pay from your portal.`,
      link: portal,
      linkLabel: "Open my portal",
    },
    "questionnaire-pending": {
      title: `A few questions: ${d.title}`,
      summary: "A short questionnaire is waiting for you. It helps me prepare.",
      link: portal,
      linkLabel: "Open my portal",
    },
    "gallery-expiring": {
      title: `Your gallery expires on ${d.date}`,
      summary: `"${d.title}" ends on ${d.date}. Download what you want to keep, or extend access from the gallery page.`,
      link: base,
      linkLabel: "Open my gallery",
    },
    "post-shoot-thanks": {
      title: "Thank you",
      summary: `Thank you for letting me photograph ${d.title}. I'm editing now and will email you when your gallery is ready.`,
      link: portal,
      linkLabel: "See progress",
    },
    "quote-unanswered": {
      title: `Your quote ${d.title}`,
      summary: "Just checking in on your quote. It is waiting in your portal, and I'm happy to change anything.",
      link: portal,
      linkLabel: "Review the quote",
    },
    "appointment-reminder": {
      title: `Reminder: ${d.title}`,
      summary: `${d.title} is coming up${d.detail ? ` at ${d.detail}` : ""}.`,
      link: portal,
      linkLabel: "See details",
    },
  };
  const x = m[rule];
  return { ...x, detail: note || undefined };
}

export type AutomationSummary = { sent: number; skipped: number; found: number; byRule: Record<string, number> };

/** Runs every enabled rule: find what is due, claim each run once (dedupe), respect reminder preferences, email. Safe to re-run. */
export async function runAutomations(db: Database, now = new Date()): Promise<AutomationSummary> {
  const cfg = await auto.ruleConfig(db);
  const sum: AutomationSummary = { sent: 0, skipped: 0, found: 0, byRule: {} };
  for (const r of cfg) {
    if (!r.enabled) continue;
    for (const d of await auto.findDue(db, r.key, r.days, now)) {
      sum.found++;
      const claimed = await auto.claimRun(db, {
        key: d.key,
        rule: r.key,
        entityType: d.entityType,
        entityId: d.entityId,
      });
      if (!claimed) continue;
      if (!(await auto.remindersAllowed(db, d.clientId))) {
        sum.skipped++;
        continue;
      }
      const c = content(r.key, d, r.message);
      await sendTemplate(
        db,
        d.email,
        "reminder",
        { name: d.name, title: c.title, summary: c.summary, detail: c.detail, link: c.link, linkLabel: c.linkLabel },
        { related: { type: d.entityType, id: d.entityId } },
      );
      sum.sent++;
      sum.byRule[r.key] = (sum.byRule[r.key] ?? 0) + 1;
    }
  }
  return sum;
}

/** Everything the scheduled job does in one pass. */
export async function runScheduled(db: Database, now = new Date()) {
  await cal.releaseExpiredHolds(db, now);
  const billing = await runBillingJobs(db, now);
  const published = await publishScheduled(db, now);
  const carts = await remindAbandonedOrders(db, now);
  const archived = await archiveExpired(db, now);
  const automations = await runAutomations(db, now);
  return {
    billing,
    automations,
    galleriesPublished: published,
    cartReminders: carts,
    galleriesArchived: archived,
    at: now.toISOString(),
  };
}
void usd;

/** One reminder, a day after a shop order was started and not paid. The link goes back to the payment page. */
export async function remindAbandonedOrders(db: Database, now = new Date()) {
  const rows = await shop.abandonedOrders(db, now, 24);
  let sent = 0;
  for (const o of rows) {
    const [inv] = o.invoiceId
      ? await db.select().from(schema.studioInvoices).where(eq(schema.studioInvoices.id, o.invoiceId))
      : [];
    if (!inv || inv.status === "paid" || inv.status === "void") {
      await shop.markReminded(db, o.id, now);
      continue;
    }
    // the payment link token is only stored hashed, so the reminder points back to the gallery where the cart is kept
    const [g] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, o.galleryId));
    if (g && !shop.readShop(g.shop).abandonedCart) {
      await shop.markReminded(db, o.id, now); // this gallery's store switched reminders off
      continue;
    }
    await sendTemplate(
      db,
      o.buyerEmail,
      "order-reminder",
      {
        name: o.buyerName,
        title: o.number,
        amount: usd(o.totalCents),
        link: g?.slug ? `${getSite("photos").url}/g/${g.slug}` : getSite("photos").url,
      },
      { related: { type: "order", id: o.id } },
    );
    await shop.markReminded(db, o.id, now);
    sent++;
  }
  return sent;
}

/** Galleries set to archive themselves after they expire. */
export async function archiveExpired(db: Database, now = new Date()) {
  const due = await gal.dueToArchive(db, now);
  for (const g of due)
    await db
      .update(schema.studioGalleries)
      .set({ status: "archived", updatedAt: now, updatedBy: "schedule" })
      .where(eq(schema.studioGalleries.id, g.id));
  return due.length;
}
