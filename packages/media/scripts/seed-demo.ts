// Fills the LOCAL dev database with one clearly-labelled SAMPLE entry of each studio thing, so every page has something to show.
// Never runs against production (refuses a Neon URL). Idempotent: skips when the sample clients already exist.
// Usage: pnpm --filter @jerryqiu/media seed:demo     (needs `pnpm dev:db` and the same env the photos app uses)
import { getDb, schema } from "@jerryqiu/db";
import * as auto from "@jerryqiu/db/automation";
import * as bill from "@jerryqiu/db/billing";
import * as cal from "@jerryqiu/db/calendar";
import * as com from "@jerryqiu/db/commerce";
import * as forms from "@jerryqiu/db/forms";
import * as gal from "@jerryqiu/db/galleries";
import { saveStyle } from "@jerryqiu/db/gallery-security";
import * as shopDb from "@jerryqiu/db/gallery-shop";
import * as portal from "@jerryqiu/db/portal";
import * as st from "@jerryqiu/db/studio";
import { createStorage } from "@jerryqiu/storage";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { ingestImage } from "../src";

const url = process.env.DATABASE_URL ?? "";
if (!url || /neon\.tech|neon\.build/.test(url) || process.env.NODE_ENV === "production")
  throw new Error("The demo seed only runs against a local development database.");
const found = getDb();
if (!found) throw new Error("DATABASE_URL is not set");
const db = found;

const day = (n: number) => new Date(Date.now() + n * 86_400_000);
const ymd = (n: number) => day(n).toISOString().slice(0, 10);
const at = (n: number, hour: number) => {
  const d = day(n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/** Gives the sample galleries their own links, albums (one inside another, one locked) and an open shop. Safe to repeat. */
async function enrichGalleries() {
  const rows = await db.select().from(schema.studioGalleries);
  const wedding = rows.find((g) => g.title === "SAMPLE Okafor wedding");
  const family = rows.find((g) => g.title === "SAMPLE Reyes family portraits");
  if (wedding && !wedding.slug) {
    await shopDb.setLink(db, wedding.id, { slug: "okafor-wedding", visibility: "link" });
    await shopDb.saveShop(db, wedding.id, { enabled: true, note: "SAMPLE shop: prices are placeholders." });
    await saveStyle(db, wedding.id, {
      font: "editorial",
      header: "cinematic",
      albumView: "cards",
      gap: "normal",
      corners: "soft",
      brandLine: "SAMPLE Studio",
    });
    const albums = await gal.listAlbums(db, wedding.id);
    const ceremony = albums.find((a) => a.name === "Ceremony");
    const items = await gal.galleryContents(db, wedding.id);
    if (ceremony) {
      const vows = await gal.createAlbum(db, wedding.id, "Vows", ceremony.id);
      await gal.moveToAlbum(
        db,
        wedding.id,
        items.slice(0, 2).map((i) => i.media.id),
        vows.id,
      );
      await gal.updateAlbum(db, wedding.id, ceremony.id, { description: "SAMPLE: the ceremony, in order." });
    }
    const formals = await gal.createAlbum(db, wedding.id, "Family formals");
    await gal.moveToAlbum(
      db,
      wedding.id,
      items.slice(8, 11).map((i) => i.media.id),
      formals.id,
    );
    await gal.updateAlbum(db, wedding.id, formals.id, {
      passcode: "formals-2026",
      description: "SAMPLE locked album. Passcode: formals-2026",
    });
    console.log("Sample gallery link: /g/okafor-wedding (locked album passcode: formals-2026)");
  }
  if (family && !family.slug) {
    await shopDb.setLink(db, family.id, { slug: "reyes-family", visibility: "link" });
    await shopDb.saveShop(db, family.id, {
      enabled: true,
      freeDownloads: "web",
      note: "SAMPLE: web-size copies are free.",
    });
    await saveStyle(db, family.id, { font: "classic", header: "split", brandLine: "SAMPLE Studio" });
    await gal.updateGallery(db, family.id, { theme: "paper", layout: "mosaic" });
    await st.publishGallery(db, family.id).catch(() => {});
    console.log("Sample gallery link: /g/reyes-family");
  }
}

const existing = await db
  .select()
  .from(schema.studioClients)
  .where(eq(schema.studioClients.email, "sample-maya@example.test"));
if (existing.length) {
  await enrichGalleries();
  console.log("Sample data is already there. Nothing more to add.");
  process.exit(0);
}

await com.seedSampleCatalog(db);
await forms.seedSampleTemplates(db);
await forms.seedSampleQuestionnaires(db);

/* clients and jobs */
const maya = await st.createClient(db, {
  name: "SAMPLE Maya Okafor",
  email: "sample-maya@example.test",
  phone: "555-0101",
  notes: "Sample client for the demo.",
});
const dan = await st.createClient(db, {
  name: "SAMPLE Daniel Reyes",
  email: "sample-daniel@example.test",
  phone: "555-0102",
});
const priya = await st.createClient(db, { name: "SAMPLE Priya Nair", email: "sample-priya@example.test" });
const wedding = await st.createJob(db, {
  clientId: maya.id,
  title: "SAMPLE Okafor wedding",
  date: ymd(-12),
  location: "Brooklyn, NY",
  type: "wedding",
  feeCents: 240000,
});
const portrait = await st.createJob(db, {
  clientId: dan.id,
  title: "SAMPLE Reyes family portraits",
  date: ymd(9),
  location: "Prospect Park",
  type: "portrait",
  feeCents: 45000,
});
const event = await st.createJob(db, {
  clientId: priya.id,
  title: "SAMPLE Nair graduation party",
  date: ymd(24),
  location: "Queens, NY",
  type: "event",
  feeCents: 90000,
});
for (let i = 0; i < 4; i++) await st.advanceJob(db, wedding.id);
await st.advanceJob(db, portrait.id);
await db
  .update(schema.studioJobs)
  .set({ deliveryEta: ymd(6) })
  .where(eq(schema.studioJobs.id, wedding.id));

/* inquiries */
await st.addInquiry(db, {
  name: "SAMPLE Alex Chen",
  email: "sample-alex@example.test",
  message: "Hi, we are planning a 60-guest engagement party in the spring and would love to talk about coverage.",
  shootType: "Event",
  eventDate: ymd(80),
  location: "Manhattan",
  budget: "$1,500",
  phone: "555-0103",
  source: "Referral",
});
await st.addInquiry(db, {
  name: "SAMPLE Jordan Lee",
  email: "sample-jordan@example.test",
  message: "Do you shoot headshots for small teams?",
  shootType: "Portrait",
});
await st.addInquiry(db, {
  name: "SAMPLE Sam Rivera",
  email: "sample-sam@example.test",
  message: "Looking for aviation photography at an airshow next month, are you available?",
  topic: "Aviation",
  eventDate: ymd(30),
});

/* calendar */
await cal.addAppointment(db, {
  kind: "consult",
  status: "confirmed",
  title: "SAMPLE Consultation: Alex Chen",
  startsAt: at(2, 11),
  endsAt: new Date(at(2, 11).getTime() + 1_800_000),
  location: "Video call",
});
await cal.addAppointment(db, {
  kind: "shoot",
  status: "confirmed",
  title: "SAMPLE Reyes family portraits",
  startsAt: at(9, 16),
  endsAt: at(9, 18),
  location: "Prospect Park",
  jobId: portrait.id,
  clientId: dan.id,
  travelMin: 30,
});
await cal.addAppointment(db, {
  kind: "shoot",
  status: "hold",
  title: "SAMPLE Nair graduation party",
  startsAt: at(24, 14),
  endsAt: at(24, 19),
  location: "Queens, NY",
  jobId: event.id,
  clientId: priya.id,
  holdUntil: day(5),
});
await cal.addRule(db, { weekday: 2, startMinute: 600, endMinute: 960 }).catch(() => {});
await cal.addRule(db, { weekday: 4, startMinute: 600, endMinute: 960 }).catch(() => {});

/* contracts */
const templates = await forms.listTemplates(db);
const tpl = templates.find((t) => t.slug === "event") ?? templates[0];
if (tpl) {
  const { contract } = await forms.createContractFromTemplate(db, { jobId: wedding.id, templateId: tpl.id });
  await st.sendContract(db, contract.id);
  const { contract: c2 } = await forms.createContractFromTemplate(db, { jobId: portrait.id, templateId: tpl.id });
  void c2;
}

/* invoices and payments */
const paid = await st.createInvoice(db, {
  jobId: wedding.id,
  lines: [{ description: "SAMPLE Deposit", amountCents: 80000 }],
  dueDate: ymd(-30),
});
await st.sendInvoice(db, paid.id);
await st.recordPayment(db, {
  invoiceId: paid.id,
  provider: "mock",
  providerRef: "pi_sample_deposit",
  amountCents: 80000,
  status: "succeeded",
  method: "mock",
  receiptRef: "rcpt_sample_1",
});
const unpaid = await st.createInvoice(db, {
  jobId: wedding.id,
  lines: [
    { description: "SAMPLE Balance: coverage", amountCents: 140000 },
    { description: "SAMPLE Extra edited images", amountCents: 20000 },
  ],
  dueDate: ymd(7),
});
await st.sendInvoice(db, unpaid.id);
const overdue = await st.createInvoice(db, {
  jobId: portrait.id,
  lines: [{ description: "SAMPLE Portrait session", amountCents: 45000 }],
  dueDate: ymd(-5),
});
await st.sendInvoice(db, overdue.id);
await st.createInvoice(db, {
  jobId: event.id,
  lines: [{ description: "SAMPLE Party coverage (draft)", amountCents: 90000 }],
});
await bill
  .createPaymentPlan(db, {
    jobId: event.id,
    totalCents: 90000,
    count: 3,
    firstDueOn: ymd(10),
    every: "month",
    name: "SAMPLE Party plan",
  })
  .catch((e) => console.log("plan:", e.message));
await bill
  .createRecurring(db, {
    jobId: portrait.id,
    description: "SAMPLE Monthly retainer",
    amountCents: 15000,
    intervalMonths: 1,
    startOn: ymd(15),
  })
  .catch((e) => console.log("recurring:", e.message));

/* quote */
const pkgs = await com.listPackages(db);
const q = await com
  .createQuote(db, {
    clientId: priya.id,
    title: "SAMPLE Graduation party quote",
    packageId: pkgs[1]?.id ?? pkgs[0]?.id ?? null,
    jobId: event.id,
  })
  .catch((e: Error) => {
    console.log("quote:", e.message);
    return null;
  });
if (q) await com.sendQuote(db, q.id).catch(() => {});

/* galleries with generated photographs */
const originals = createStorage("originals");
const publicStore = createStorage("public");
const hues = [12, 28, 48, 110, 165, 200, 235, 285, 320, 350];
async function photo(i: number, w: number, h: number) {
  const hue = hues[i % hues.length];
  const noise = Buffer.alloc(w * h * 3);
  for (let k = 0; k < noise.length; k++) noise[k] = (k * 2654435761) >>> 24;
  const base = await sharp({ create: { width: w, height: h, channels: 3, background: `hsl(${hue} 55% 52%)` } })
    .jpeg()
    .toBuffer();
  return sharp(base)
    .composite([
      {
        input: await sharp(noise, { raw: { width: w, height: h, channels: 3 } })
          .jpeg()
          .toBuffer(),
        blend: "soft-light",
      },
    ])
    .jpeg({ quality: 88 })
    .toBuffer();
}
async function fill(galleryId: string, label: string, n: number) {
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const portraitShape = i % 3 === 1;
    const r = await ingestImage({
      db,
      originals,
      publicStore,
      filename: `${label}-${String(i + 1).padStart(3, "0")}.jpg`,
      bytes: await photo(i, portraitShape ? 1200 : 1800, portraitShape ? 1800 : 1200),
      user: "demo",
      defaultReview: false,
    });
    ids.push(r.id);
  }
  await gal.addItems(db, galleryId, ids);
  return ids;
}
const g1 = await st.createGallery(db, { jobId: wedding.id, title: "SAMPLE Okafor wedding", passcode: "sample-demo-1" });
const g1ids = await fill(g1.id, "wedding", 12);
await gal.setCover(db, g1.id, g1ids[0]);
const album = await gal.createAlbum(db, g1.id, "Ceremony");
await gal.moveToAlbum(db, g1.id, g1ids.slice(0, 5), album.id);
await gal.updateGallery(db, g1.id, {
  welcome: "SAMPLE gallery: thank you for letting me be part of your day.",
  accessMonths: 6,
  downloadPolicy: "web",
  layout: "masonry",
});
await st.publishGallery(db, g1.id);
await gal.rate(db, g1.id, g1ids[0], 5).catch(() => {});
await gal.comment(db, g1.id, g1ids[2], "SAMPLE: could this one be a little warmer?", "client").catch(() => {});
const g2 = await st.createGallery(db, {
  jobId: portrait.id,
  title: "SAMPLE Reyes family portraits",
  passcode: "sample-demo-2",
});
await fill(g2.id, "family", 6);
await gal.updateGallery(db, g2.id, { layout: "rows", theme: "light" });

/* portal, messages, tasks, notifications, questionnaire */
await portal.ensureAccount(db, maya.id);
await portal.postMessage(db, {
  clientId: maya.id,
  jobId: wedding.id,
  direction: "in",
  body: "SAMPLE: Hi! When can we expect the first photos?",
});
await portal.postMessage(db, {
  clientId: maya.id,
  jobId: wedding.id,
  direction: "out",
  body: "SAMPLE: Within a week, I will email you as soon as the gallery is ready.",
});
await auto.addTask(db, {
  title: "SAMPLE Cull and edit the Okafor wedding",
  dueOn: ymd(3),
  jobId: wedding.id,
  clientId: maya.id,
});
await auto.addTask(db, {
  title: "SAMPLE Send Reyes family prep guide",
  dueOn: ymd(5),
  jobId: portrait.id,
  clientId: dan.id,
});
await auto.addTask(db, { title: "SAMPLE Order prints for the Nair party", dueOn: ymd(20) });
for (const n of [
  {
    kind: "booking",
    title: "SAMPLE New inquiry from Alex Chen",
    body: "Engagement party, spring",
    link: "/studio/bookings",
  },
  { kind: "payment", title: "SAMPLE Deposit received", body: "$800.00 from Maya Okafor", link: "/studio/billing" },
  { kind: "gallery", title: "SAMPLE Gallery opened", body: "Okafor wedding", link: "/studio/galleries" },
])
  await auto.notify(db, n);
const qs = await forms.listQuestionnaires(db);
if (qs[0])
  await forms
    .sendQuestionnaire(db, { questionnaireId: qs[0].id, clientId: maya.id, jobId: wedding.id })
    .catch(() => {});

console.log(
  "Sample data added. Client galleries open at /client with the passcodes sample-demo-1 (published) and sample-demo-2. Public links: /g/okafor-wedding and /g/reyes-family (locked album passcode: formals-2026).",
);
await enrichGalleries();
process.exit(0);
