import type { Cents } from "./money";
import { mockId } from "./store";

/**
 * Score store domain. Compositions are plainly fake (SAMPLE, Q34): the owner enters real works and prices later. LISTEN and
 * SCORE are separate paths: a recording is optional and independent of whether a score is for sale.
 */
export type Composition = {
  slug: string;
  title: string;
  /** "SAMPLE" until the owner supplies real works */
  year: number;
  forces: string;
  durationMin: number;
  /** a performance recording exists (embed or file); gates the LISTEN path */
  recording?: { provider: "youtube" | "soundcloud" | "bandcamp" | "spotify"; id: string };
  /** score for sale */
  score?: { priceCents: Cents; pages: number; format: "PDF"; licence: string };
  sample: true;
};

export const compositions: Composition[] = [
  {
    slug: "sample-nocturne-for-brass",
    title: "SAMPLE: Nocturne for Brass Quartet",
    year: 2025,
    forces: "2 trumpets, horn, trombone",
    durationMin: 6,
    score: { priceCents: 1200, pages: 9, format: "PDF", licence: "Personal and ensemble performance; no resale." },
    sample: true,
  },
  {
    slug: "sample-three-small-pieces",
    title: "SAMPLE: Three Small Pieces",
    year: 2024,
    forces: "solo trombone",
    durationMin: 5,
    recording: { provider: "youtube", id: "dQw4w9WgXcQ" },
    score: { priceCents: 800, pages: 6, format: "PDF", licence: "Personal and ensemble performance; no resale." },
    sample: true,
  },
  {
    slug: "sample-afterglow-study",
    title: "SAMPLE: Afterglow Study",
    year: 2026,
    forces: "piano",
    durationMin: 4,
    recording: { provider: "soundcloud", id: "000000000" },
    sample: true,
  },
  {
    slug: "sample-window-music",
    title: "SAMPLE: Window Music",
    year: 2023,
    forces: "string trio",
    durationMin: 8,
    score: { priceCents: 1500, pages: 14, format: "PDF", licence: "Personal and ensemble performance; no resale." },
    sample: true,
  },
];

export const hasListen = (c: Composition) => !!c.recording;
export const hasScore = (c: Composition) => !!c.score;
export const bySlug = (slug: string) => compositions.find((c) => c.slug === slug);

/* ---- Cart and orders ---- */
export type CartLine = { slug: string; priceCents: Cents };
export type Order = {
  id: string;
  createdAt: string;
  lines: CartLine[];
  totalCents: Cents;
  receiptId: string;
  email: string;
  mock: true;
};

export function addToCart(cart: CartLine[], slug: string): CartLine[] {
  const c = bySlug(slug);
  if (!c?.score) throw new Error("This composition has no score for sale.");
  if (cart.some((l) => l.slug === slug)) return cart; // a score is bought once
  return [...cart, { slug, priceCents: c.score.priceCents }];
}
export const removeFromCart = (cart: CartLine[], slug: string) => cart.filter((l) => l.slug !== slug);
export const cartTotal = (cart: CartLine[]): Cents => cart.reduce((n, l) => n + l.priceCents, 0);

export function makeOrder(cart: CartLine[], email: string, receiptId: string, now = new Date()): Order {
  if (!cart.length) throw new Error("The cart is empty.");
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error("Enter an email address for the receipt.");
  return {
    id: mockId("ord_mock"),
    createdAt: now.toISOString(),
    lines: cart,
    totalCents: cartTotal(cart),
    receiptId,
    email: email.trim(),
    mock: true,
  };
}

/* ---- Delivery interface ---- */
export type PreviewPage = { n: number; svg: string };
export type DeliveredFile = { filename: string; mime: string; bytes: Uint8Array };

export interface ScoreDelivery {
  /** Watermarked preview pages (images, never the file): at most 2 pages or a third of the score. */
  preview(slug: string): PreviewPage[];
  /** The purchased file. Phase 3 serves the real PDF from private storage after checking the order. */
  deliver(order: Order, slug: string): DeliveredFile;
}

function staffSvg(title: string, page: number, pages: number): string {
  const lines = [0, 1, 2, 3, 4]
    .map((i) => `<line x1="40" x2="560" y1="${90 + i * 10}" y2="${90 + i * 10}" stroke="#222" stroke-width="1"/>`)
    .join("");
  const staves = [0, 1, 2, 3, 4, 5].map((s) => `<g transform="translate(0 ${s * 100})">${lines}</g>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 780" role="img" aria-label="Preview page ${page} of ${pages}">` +
    `<rect width="600" height="780" fill="#fbfaf6"/><text x="300" y="50" text-anchor="middle" font-family="Georgia,serif" font-size="22">${title.replace(/&/g, "&amp;")}</text>` +
    `<g transform="translate(0 -20)">${staves}</g>` +
    `<g transform="rotate(-28 300 400)" opacity="0.16" font-family="monospace" font-size="54" text-anchor="middle" fill="#000"><text x="300" y="380">MOCK PREVIEW</text><text x="300" y="450">NOT FOR PERFORMANCE</text></g>` +
    `<text x="300" y="765" text-anchor="middle" font-family="monospace" font-size="11" fill="#555">page ${page} of ${pages} · sample, no music engraved</text></svg>`
  );
}

export class MockScoreDelivery implements ScoreDelivery {
  preview(slug: string): PreviewPage[] {
    const c = bySlug(slug);
    if (!c?.score) return [];
    const n = Math.max(1, Math.min(2, Math.floor(c.score.pages / 3)));
    return Array.from({ length: n }, (_, i) => ({ n: i + 1, svg: staffSvg(c.title, i + 1, c.score!.pages) }));
  }
  deliver(order: Order, slug: string): DeliveredFile {
    if (!order.lines.some((l) => l.slug === slug)) throw new Error("This score is not part of the order.");
    const c = bySlug(slug)!;
    const text = `MOCK SCORE FILE (placeholder)\n\n${c.title}\nOrder ${order.id}\nReceipt ${order.receiptId}\n\nThis is not a real score. Phase 3 delivers the owner's PDF here.\n`;
    return { filename: `${slug}-MOCK.txt`, mime: "text/plain", bytes: new TextEncoder().encode(text) };
  }
}
