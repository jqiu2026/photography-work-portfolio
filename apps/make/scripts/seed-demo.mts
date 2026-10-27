// Development only: three labeled SAMPLE projects with generated stand-in screenshots and a few now-log lines, so the local
// site and the studio have something to show. Refuses to run in production.
import { getDb, schema } from "@jerryqiu/db";
import * as mk from "@jerryqiu/db/make";
import { createStorage } from "@jerryqiu/storage";
import { sql } from "drizzle-orm";
import sharp from "sharp";

if (process.env.NODE_ENV === "production") throw new Error("The demo seed never runs in production.");
const db = getDb();
if (!db) throw new Error("No DATABASE_URL: start the local database first (pnpm dev:db).");
const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.makeProjects);
if (n > 0) {
  console.log(`[make seed] ${n} projects already exist; nothing to do.`);
  process.exit(0);
}
const store = createStorage("public");

async function shot(title: string, hue: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},60%,22%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360},60%,12%)"/></linearGradient></defs><rect width="1200" height="750" fill="url(#g)"/><text x="60" y="110" font-family="sans-serif" font-size="54" fill="#fff">${title}</text><text x="60" y="170" font-family="sans-serif" font-size="28" fill="#cfd">SAMPLE screenshot: a stand-in image</text></svg>`;
  const out = await sharp(Buffer.from(svg)).webp().toBuffer({ resolveWithObject: true });
  return out;
}

const spec = [
  { title: "SAMPLE: Build pipeline", status: "building" as const, stack: ["TypeScript", "Postgres"], hue: 150 },
  { title: "SAMPLE: Club website", status: "shipped" as const, stack: ["Next.js", "TypeScript", "Figma"], hue: 210 },
  { title: "SAMPLE: Scheduling bot", status: "shipped" as const, stack: ["Python", "Postgres"], hue: 38 },
  {
    title: "SAMPLE: Failed prototype",
    status: "archived" as const,
    stack: ["Rust"],
    hue: 322,
    lessons: "SAMPLE: what went wrong would be written here.",
  },
];
for (const s of spec) {
  const p = await mk.saveProject(db, {
    title: s.title,
    status: s.status,
    stack: s.stack,
    published: true,
    year: 2026,
    summary: "SAMPLE: placeholder text standing in for a real one-line summary.",
    body: "SAMPLE write-up.\n\n## How it works\n\nTODO(owner): describe the real project here, in Markdown.\n\n- one\n- two",
    role: "SAMPLE: built it alone",
    lessons: s.lessons ?? null,
    links: [{ label: "Try it", url: "https://example.com/demo", kind: "demo" }],
  });
  const img = await shot(s.title, s.hue);
  const key = `make/seed-${p.slug}.webp`;
  await store.put(key, new Uint8Array(img.data), { contentType: "image/webp" });
  const row = await mk.addImage(db, p.id, {
    storageKey: key,
    mime: "image/webp",
    width: img.info.width,
    height: img.info.height,
    alt: "",
  });
  await mk.saveImage(db, row.id, { alt: `SAMPLE stand-in screenshot for ${s.title}`, reviewed: true });
}
await mk.addNow(db, "SAMPLE: rewriting the build pipeline, again.");
await mk.addNow(db, "SAMPLE: reading about local-first sync.");
console.log("[make seed] added labeled SAMPLE projects. Enter the real ones in the studio.");
process.exit(0);
