import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Print fulfilment behind an interface. `WhccProvider` is the real adapter, written from the owner's notes on WHCC's Order
 * Submit API (authenticate, import an order as JSON, check the response, confirm with the ConfirmationID, then webhooks). It
 * is NOT VERIFIED against the live service and is never constructed without WHCC_BASE_URL, WHCC_CONSUMER_KEY and
 * WHCC_CONSUMER_SECRET (TODO(owner): request API credentials from WHCC and test in their sandbox first). `MockPrintProvider`
 * is the labelled stand-in: a fixed SAMPLE catalogue and a deterministic order book, no network, off in production unless
 * mocks are enabled. Every base URL, id and price in the mock is a PLACEHOLDER.
 */
export type ProductKind = "print" | "canvas" | "album" | "card";
export type CatalogProduct = {
  sku: string;
  kind: ProductKind;
  name: string;
  widthIn: number;
  heightIn: number;
  /** What the lab charges the studio, in cents (SAMPLE in the mock). */
  wholesaleCents: number;
  /** Fewest pixels on the long side for an acceptable result (derived from the 180 ppi floor). */
  minLongSidePx: number;
};
export type Address = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};
export type OrderItem = { sku: string; qty: number; fileUrl: string; mediaId: string };
export type OrderInput = { reference: string; items: OrderItem[]; ship: Address };
export type ShippingQuote = { cents: number; label: string };
export type SubmitResult = { providerOrderId: string; status: "submitted" };
export type Tracking = { carrier?: string; number?: string; url?: string };
export type WebhookEvent = {
  providerOrderId: string;
  status: "in-production" | "shipped" | "cancelled" | "problem";
  tracking?: Tracking;
};

export interface PrintProvider {
  readonly name: "whcc" | "mock";
  catalog(): Promise<CatalogProduct[]>;
  shipping(items: { sku: string; qty: number }[], ship: Address): Promise<ShippingQuote>;
  submit(order: OrderInput): Promise<SubmitResult>;
  /** Cancels an order that has not started production. Returns false when it is too late. */
  cancel(providerOrderId: string): Promise<boolean>;
}

/* ---------- address rules (the lab drop-ships across North America, never to a PO box) ---------- */
export const COUNTRIES = ["US", "CA", "MX"] as const;
const PO_BOX = /\b(p\.?\s*o\.?\s*box|post\s*office\s*box|pobox)\b/i;
export function addressProblem(a: Address): string | null {
  const need = (v: string | undefined, label: string) => (v && v.trim().length >= 2 ? null : `Enter the ${label}.`);
  const m =
    need(a.name, "recipient name") ??
    need(a.line1, "street address") ??
    need(a.city, "city") ??
    need(a.region, "state or province") ??
    need(a.postalCode, "postal code");
  if (m) return m;
  if (!(COUNTRIES as readonly string[]).includes(a.country))
    return "Orders ship within the United States, Canada and Mexico only.";
  if (PO_BOX.test(`${a.line1} ${a.line2 ?? ""}`)) return "The print lab cannot ship to a PO box. Use a street address.";
  if (a.country === "US" && !/^\d{5}(-\d{4})?$/.test(a.postalCode.trim())) return "Enter a 5-digit ZIP code.";
  return null;
}

/* ---------- resolution ---------- */
export const PPI_FLOOR = 180;
export const PPI_GOOD = 300;
/** A product is offered only when the photograph has enough pixels: the long side must reach size x 180 ppi. */
export function fitsProduct(
  p: Pick<CatalogProduct, "widthIn" | "heightIn">,
  width: number,
  height: number,
): { ok: boolean; ppi: number; good: boolean } {
  const longPx = Math.max(width, height);
  const shortPx = Math.min(width, height);
  const need = Math.max(p.widthIn, p.heightIn);
  const needShort = Math.min(p.widthIn, p.heightIn);
  const ppi = Math.floor(Math.min(longPx / need, shortPx / needShort));
  return { ok: ppi >= PPI_FLOOR, ppi, good: ppi >= PPI_GOOD };
}

/* ---------- pricing and margin ---------- */
/** Retail from wholesale and the studio's markup, rounded to the next 50 cents. */
export function retailCents(wholesaleCents: number, markupPercent: number): number {
  const raw = wholesaleCents * (1 + markupPercent / 100);
  return Math.ceil(raw / 50) * 50;
}
/** What a card payment costs the studio (2.9% + 30 cents, a placeholder for the real rates). */
export const feeCents = (amountCents: number) => Math.round(amountCents * 0.029) + 30;
/**
 * Margin check: the retail price must cover wholesale, the payment fee on it and this item's share of shipping. Returns the
 * margin in cents (negative = losing money), so the studio can hide or reprice a product.
 */
export function marginCents(retail: number, wholesale: number, shippingShare = 0): number {
  return retail - wholesale - feeCents(retail) - shippingShare;
}

/* ---------- signed, time-limited file links for the lab ---------- */
export function signFileLink(secret: string, orderId: string, itemIndex: number, expiresAt: number): string {
  return createHmac("sha256", secret).update(`${orderId}.${itemIndex}.${expiresAt}`).digest("base64url");
}
export function verifyFileLink(
  secret: string,
  orderId: string,
  itemIndex: number,
  expiresAt: number,
  sig: string,
  now = Date.now(),
): boolean {
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;
  const want = Buffer.from(signFileLink(secret, orderId, itemIndex, expiresAt));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

/* ---------- the labelled mock ---------- */
export const MOCK_CATALOG: CatalogProduct[] = [
  {
    sku: "MOCK-PRINT-4X6",
    kind: "print",
    name: "Print 4 x 6 in (SAMPLE)",
    widthIn: 6,
    heightIn: 4,
    wholesaleCents: 40,
    minLongSidePx: 6 * PPI_FLOOR,
  },
  {
    sku: "MOCK-PRINT-8X10",
    kind: "print",
    name: "Print 8 x 10 in (SAMPLE)",
    widthIn: 10,
    heightIn: 8,
    wholesaleCents: 250,
    minLongSidePx: 10 * PPI_FLOOR,
  },
  {
    sku: "MOCK-PRINT-11X14",
    kind: "print",
    name: "Print 11 x 14 in (SAMPLE)",
    widthIn: 14,
    heightIn: 11,
    wholesaleCents: 650,
    minLongSidePx: 14 * PPI_FLOOR,
  },
  {
    sku: "MOCK-CANVAS-16X20",
    kind: "canvas",
    name: "Canvas 16 x 20 in (SAMPLE)",
    widthIn: 20,
    heightIn: 16,
    wholesaleCents: 4200,
    minLongSidePx: 20 * PPI_FLOOR,
  },
  {
    sku: "MOCK-CARD-5X7",
    kind: "card",
    name: "Flat card 5 x 7 in (SAMPLE)",
    widthIn: 7,
    heightIn: 5,
    wholesaleCents: 120,
    minLongSidePx: 7 * PPI_FLOOR,
  },
  {
    sku: "MOCK-ALBUM-8X8",
    kind: "album",
    name: "Album 8 x 8 in, 20 pages (SAMPLE)",
    widthIn: 8,
    heightIn: 8,
    wholesaleCents: 9500,
    minLongSidePx: 8 * PPI_FLOOR,
  },
];

export function createMockPrintProvider(
  opts: { fetchFile?: (url: string) => Promise<boolean> } = {},
): PrintProvider & { orders: Map<string, OrderInput & { cancelled: boolean; started: boolean }> } {
  const orders = new Map<string, OrderInput & { cancelled: boolean; started: boolean }>();
  return {
    name: "mock",
    orders,
    async catalog() {
      return MOCK_CATALOG;
    },
    async shipping(items) {
      const n = items.reduce((a, i) => a + i.qty, 0);
      return { cents: n ? 800 + 200 * (n - 1) : 0, label: "Shipping (SAMPLE rate)" };
    },
    async submit(order) {
      const bad = addressProblem(order.ship);
      if (bad) throw new Error(bad);
      for (const it of order.items) {
        if (!MOCK_CATALOG.some((p) => p.sku === it.sku)) throw new Error(`Unknown product ${it.sku}`);
        if (opts.fetchFile && !(await opts.fetchFile(it.fileUrl)))
          throw new Error("The image file could not be fetched");
      }
      const providerOrderId = `mock-${order.reference}`;
      const existing = orders.get(providerOrderId);
      if (!existing) orders.set(providerOrderId, { ...order, cancelled: false, started: false });
      return { providerOrderId, status: "submitted" }; // idempotent per reference
    },
    async cancel(providerOrderId) {
      const o = orders.get(providerOrderId);
      if (!o || o.started) return false;
      o.cancelled = true;
      return true;
    },
  };
}

/* ---------- the real WHCC adapter (never run live here) ---------- */
export type WhccConfig = { baseUrl: string; consumerKey: string; consumerSecret: string; fetch?: typeof fetch };
/**
 * Flow from the owner's notes (NOT VERIFIED, to be tested in WHCC's sandbox): get a token with the consumer key and secret, POST the
 * order JSON to the import endpoint, read back the ConfirmationID, then POST it to confirm. Products, option ids and shipping
 * come from the lab's catalogue; the mock's SKUs are placeholders. TODO(owner): replace the placeholder paths with WHCC's.
 */
export function createWhccProvider(cfg: WhccConfig): PrintProvider {
  const f = cfg.fetch ?? fetch;
  const base = cfg.baseUrl.replace(/\/$/, "");
  let token: { value: string; exp: number } | undefined;
  const auth = async () => {
    if (token && token.exp > Date.now() + 30_000) return token.value;
    const res = await f(`${base}/api/AccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumerKey: cfg.consumerKey, consumerSecret: cfg.consumerSecret }),
    });
    const j = (await res.json().catch(() => ({}))) as { Token?: string; ExpiresIn?: number };
    if (!res.ok || !j.Token) throw new Error(`WHCC authentication failed (${res.status})`);
    token = { value: j.Token, exp: Date.now() + (j.ExpiresIn ?? 3600) * 1000 };
    return token.value;
  };
  const call = async (path: string, init: RequestInit = {}) => {
    const res = await f(`${base}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${await auth()}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(`WHCC ${path} responded ${res.status}`);
    return j;
  };
  return {
    name: "whcc",
    async catalog() {
      const j = (await call("/api/Catalog")) as {
        Products?: { Sku: string; Kind?: string; Name: string; Width: number; Height: number; PriceCents: number }[];
      };
      return (j.Products ?? []).map((p) => ({
        sku: p.Sku,
        kind: (p.Kind as ProductKind) ?? "print",
        name: p.Name,
        widthIn: p.Width,
        heightIn: p.Height,
        wholesaleCents: p.PriceCents,
        minLongSidePx: Math.max(p.Width, p.Height) * PPI_FLOOR,
      }));
    },
    async shipping(items, ship) {
      const j = (await call("/api/Shipping", {
        method: "POST",
        body: JSON.stringify({ Items: items, Address: ship }),
      })) as { Cents?: number };
      return { cents: Number(j.Cents ?? 0), label: "Shipping" };
    },
    async submit(order) {
      const bad = addressProblem(order.ship);
      if (bad) throw new Error(bad);
      const imported = (await call("/api/OrderImport", {
        method: "POST",
        headers: { "Idempotency-Key": order.reference },
        body: JSON.stringify({
          EntryId: order.reference,
          Items: order.items.map((i) => ({ Sku: i.sku, Quantity: i.qty, FileUrl: i.fileUrl })),
          ShipTo: order.ship,
        }),
      })) as { ConfirmationID?: string };
      if (!imported.ConfirmationID) throw new Error("WHCC returned no ConfirmationID");
      await call("/api/OrderImport/Submit", {
        method: "POST",
        body: JSON.stringify({ ConfirmationID: imported.ConfirmationID }),
      });
      return { providerOrderId: imported.ConfirmationID, status: "submitted" };
    },
    async cancel(providerOrderId) {
      try {
        await call("/api/Order/Cancel", { method: "POST", body: JSON.stringify({ ConfirmationID: providerOrderId }) });
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** Real WHCC when all three env names are set; otherwise the labelled mock (never in production unless mocks are enabled). */
export function printProviderFromEnv(env: Record<string, string | undefined> = process.env): PrintProvider | null {
  if (env.WHCC_BASE_URL && env.WHCC_CONSUMER_KEY && env.WHCC_CONSUMER_SECRET)
    return createWhccProvider({
      baseUrl: env.WHCC_BASE_URL,
      consumerKey: env.WHCC_CONSUMER_KEY,
      consumerSecret: env.WHCC_CONSUMER_SECRET,
    });
  return env.ENABLE_MOCKS === "true" || env.NODE_ENV !== "production" ? createMockPrintProvider() : null;
}

/** Verifies the HMAC of a lab webhook body (placeholder scheme: TODO(owner): use WHCC's documented signature). */
export function verifyWebhook(secret: string, rawBody: string, signature: string): boolean {
  const want = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const got = Buffer.from(signature);
  return want.length === got.length && timingSafeEqual(want, got);
}
export function parseWebhook(rawBody: string): WebhookEvent | null {
  try {
    const j = JSON.parse(rawBody) as {
      orderId?: string;
      status?: string;
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
    };
    if (!j.orderId || !["in-production", "shipped", "cancelled", "problem"].includes(j.status ?? "")) return null;
    return {
      providerOrderId: j.orderId,
      status: j.status as WebhookEvent["status"],
      tracking:
        j.trackingNumber || j.trackingUrl
          ? { carrier: j.carrier, number: j.trackingNumber, url: j.trackingUrl }
          : undefined,
    };
  } catch {
    return null;
  }
}
