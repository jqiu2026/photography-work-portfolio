// Development only: a few labeled SAMPLE pieces with stand-in score files, products, a bundle, a recording and a
// performance, so the local site and the studio have something to show. Refuses to run in production.
import { getDb, schema } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { samplePdf } from "@jerryqiu/scores";
import { createStorage } from "@jerryqiu/storage";
import { sql } from "drizzle-orm";

if (process.env.NODE_ENV === "production") throw new Error("The demo seed never runs in production.");
const db = getDb();
if (!db) throw new Error("No DATABASE_URL: start the local database first (pnpm dev:db).");
const store = createStorage("originals");

const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.musicWorks);
if (n > 0) {
  console.log(`[music seed] ${n} pieces already exist; nothing to do.`);
  process.exit(0);
}

const spec = [
  {
    title: "SAMPLE: Nocturne for Brass Quartet",
    year: 2025,
    forces: "2 trumpets, horn, trombone",
    instruments: ["trumpet", "horn", "trombone"],
    genre: "chamber",
    difficulty: "medium" as const,
    durationSec: 360,
    price: 1200,
    ensemble: 4000,
    featured: true,
    recording: { provider: "youtube", id: "dQw4w9WgXcQ" },
  },
  {
    title: "SAMPLE: Three Small Pieces",
    year: 2024,
    forces: "solo trombone",
    instruments: ["trombone"],
    genre: "solo",
    difficulty: "easy" as const,
    durationSec: 300,
    price: 800,
  },
  {
    title: "SAMPLE: Window Music",
    year: 2023,
    forces: "string trio",
    instruments: ["violin", "viola", "cello"],
    genre: "chamber",
    difficulty: "advanced" as const,
    durationSec: 480,
    price: 1500,
  },
  {
    title: "SAMPLE: Halation Study",
    year: 2026,
    forces: "piano",
    instruments: ["piano"],
    genre: "solo",
    difficulty: "medium" as const,
    durationSec: 240,
    recording: { provider: "soundcloud", id: "000000000" },
  },
  {
    title: "SAMPLE: Arranged Folk Song",
    year: 2026,
    forces: "brass quintet",
    instruments: ["trumpet", "trombone"],
    genre: "arrangement",
    difficulty: "easy" as const,
    durationSec: 200,
    price: 600,
    rights: "arrangement-copyrighted" as const,
  },
];
const products: string[] = [];
for (const [i, s] of spec.entries()) {
  const w = await m.saveWork(db, {
    title: s.title,
    year: s.year,
    forces: s.forces,
    instruments: s.instruments,
    genre: s.genre,
    difficulty: s.difficulty,
    durationSec: s.durationSec,
    status: "published",
    featured: s.featured ?? false,
    summary: "SAMPLE: placeholder text standing in for a real description.",
    programNote:
      "SAMPLE: a program note would go here, in the composer's voice.\n\nTODO(owner): enter the real pieces in the studio.",
    rightsType: s.rights ?? "original",
    licenseOnFile: false,
  });
  void i;
  if (s.price) {
    const key = `scores/${w.id}/${w.slug}.pdf`;
    const bytes = await samplePdf(s.title, 6);
    await store.put(key, bytes, { contentType: "application/pdf" });
    const f = await m.addScoreFile(db, w.id, {
      kind: "full-score",
      label: "Score",
      filename: `${w.slug}.pdf`,
      mime: "application/pdf",
      storageKey: key,
      bytes: bytes.length,
      pages: 6,
      previewPages: 2,
    });
    const p = await m.saveProduct(db, w.id, { title: "Score, personal license", priceCents: s.price, fileIds: [f.id] });
    products.push(p.id);
    if (s.ensemble)
      await m.saveProduct(db, w.id, {
        title: "Score, ensemble license",
        tier: "ensemble",
        priceCents: s.ensemble,
        fileIds: [f.id],
      });
  }
  if (s.recording)
    await db.insert(schema.musicItems).values({
      kind: "recording",
      title: `${s.title} (recording)`,
      provider: s.recording.provider,
      embedId: s.recording.id,
      workId: w.id,
      note: "SAMPLE recording",
      rights: "original",
    });
}
if (products.length >= 2)
  await m.saveBundle(db, {
    title: "SAMPLE: Two for one",
    description: "SAMPLE bundle",
    priceCents: 1700,
    productIds: products.slice(0, 2),
  });
await db.insert(schema.musicItems).values({
  kind: "performance",
  title: "SAMPLE: Nocturne premiere",
  date: "2026-05-02",
  venue: "SAMPLE Hall",
  ensemble: "SAMPLE Brass",
});
console.log("[music seed] added labeled SAMPLE pieces. Enter the real ones in the studio.");
process.exit(0);
