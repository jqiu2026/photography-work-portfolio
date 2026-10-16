import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./client";
import { getStudioSetting, setStudioSetting } from "./calendar";
import { StudioError } from "./errors";
import * as s from "./schema";

/**
 * The platform's two plans. "Free" is for trying it: a few galleries, a small allowance, no shop or music. "Full Frame" is
 * everything, with the larger allowance. The owner's account is Full Frame, billed monthly at a 100% discount ($0), so the
 * code path is the same one a paying customer would use. Prices here are SAMPLE until the owner sets them.
 */
export type PlanKey = "free" | "fullframe";
export type PlanLimits = {
  name: string;
  tagline: string;
  /** Monthly price in cents (SAMPLE until set). */
  priceCents: number;
  galleries: number | null;
  photosPerGallery: number;
  storageBytes: number;
  shop: boolean;
  music: boolean;
  downloadRules: number;
  watermarks: number;
  reports: boolean;
  emailGate: boolean;
};
const GB = 1024 ** 3;
export const PLANS: Record<PlanKey, PlanLimits> = {
  free: {
    name: "Free",
    tagline: "Try it: a few galleries, proofing and downloads.",
    priceCents: 0,
    galleries: 3,
    photosPerGallery: 300,
    storageBytes: 2 * GB,
    shop: false,
    music: false,
    downloadRules: 1,
    watermarks: 1,
    reports: false,
    emailGate: false,
  },
  fullframe: {
    name: "Full Frame",
    tagline: "Everything: unlimited galleries, a shop, music, reports and a big upload allowance.",
    priceCents: 2900,
    galleries: null,
    photosPerGallery: 5000,
    storageBytes: 1024 * GB,
    shop: true,
    music: true,
    downloadRules: 12,
    watermarks: 20,
    reports: true,
    emailGate: true,
  },
};
export const PLAN_PRICE_IS_SAMPLE = true;

const planStateSchema = z.object({
  plan: z.enum(["free", "fullframe"]).default("fullframe"),
  /** Billed at this percent off (100 = free forever, still invoiced monthly at $0). */
  discountPct: z.number().int().min(0).max(100).default(100),
  since: z.string().default(""),
  /** Stripe ids, once a real subscription exists. */
  customerId: z.string().default(""),
  subscriptionId: z.string().default(""),
});
export type PlanState = z.infer<typeof planStateSchema>;
export const getPlanState = (db: Database) => getStudioSetting(db, "plan", planStateSchema);

export function monthlyDue(state: PlanState) {
  const p = PLANS[state.plan];
  return Math.round(p.priceCents * (1 - state.discountPct / 100));
}

export async function usage(db: Database) {
  const [g] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.studioGalleries)
    .where(and(isNull(s.studioGalleries.deletedAt), sql`${s.studioGalleries.status} <> 'archived'`));
  const [m] = await db
    .select({ bytes: sql<number>`coalesce(sum(${s.media.bytes}), 0)::bigint` })
    .from(s.media)
    .innerJoin(s.studioGalleryItems, eq(s.studioGalleryItems.mediaId, s.media.id));
  return { galleries: g?.n ?? 0, storageBytes: Number(m?.bytes ?? 0) };
}

export async function planOverview(db: Database) {
  const state = await getPlanState(db);
  const limits = PLANS[state.plan];
  const u = await usage(db);
  return { state, limits, usage: u, due: monthlyDue(state) };
}

export type PlanCheck = "galleries" | "shop" | "music" | "emailGate" | "reports";
/** Throws a StudioError that names the limit and the plan that lifts it. */
export async function assertPlan(db: Database, what: PlanCheck) {
  const { limits, usage: u } = await planOverview(db);
  const upgrade = " Upgrade to Full Frame in Settings, Plan and billing.";
  if (what === "galleries" && limits.galleries !== null && u.galleries >= limits.galleries)
    throw new StudioError(`The ${limits.name} plan has ${limits.galleries} active galleries.${upgrade}`);
  if (what === "shop" && !limits.shop) throw new StudioError(`The shop is part of Full Frame.${upgrade}`);
  if (what === "music" && !limits.music) throw new StudioError(`Gallery music is part of Full Frame.${upgrade}`);
  if (what === "emailGate" && !limits.emailGate)
    throw new StudioError(`Asking visitors for an email is part of Full Frame.${upgrade}`);
  if (what === "reports" && !limits.reports) throw new StudioError(`Reports are part of Full Frame.${upgrade}`);
}
/** Room for `bytes` more photographs, and for `adding` more photographs in this gallery. */
export async function assertUpload(db: Database, galleryId: string, bytes: number, adding = 1) {
  const { limits, usage: u } = await planOverview(db);
  if (u.storageBytes + bytes > limits.storageBytes)
    throw new StudioError(
      `That would pass the ${limits.name} plan's ${Math.round(limits.storageBytes / GB)} GB allowance. Upgrade to Full Frame for more room.`,
    );
  const [c] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.studioGalleryItems)
    .where(eq(s.studioGalleryItems.galleryId, galleryId));
  if ((c?.n ?? 0) + adding > limits.photosPerGallery)
    throw new StudioError(
      `A gallery on the ${limits.name} plan holds ${limits.photosPerGallery} photographs. Upgrade to Full Frame for more.`,
    );
}

export async function setPlan(
  db: Database,
  plan: PlanKey,
  opts: { discountPct?: number; ids?: { customerId?: string; subscriptionId?: string } } = {},
  now = new Date(),
) {
  const cur = await getPlanState(db);
  const next: PlanState = {
    ...cur,
    plan,
    discountPct: opts.discountPct ?? (plan === "free" ? 0 : cur.discountPct),
    since: now.toISOString().slice(0, 10),
    customerId: opts.ids?.customerId ?? cur.customerId,
    subscriptionId: opts.ids?.subscriptionId ?? cur.subscriptionId,
  };
  await setStudioSetting(db, "plan", next);
  return next;
}
export async function recordPlanCharge(
  db: Database,
  description: string,
  amountCents: number,
  status: "paid" | "free" | "failed" = amountCents ? "paid" : "free",
  at = new Date(),
) {
  const [row] = await db.insert(s.studioPlanCharges).values({ description, amountCents, status, at }).returning();
  return row;
}
export async function listPlanCharges(db: Database, limit = 24) {
  return db.select().from(s.studioPlanCharges).orderBy(desc(s.studioPlanCharges.at)).limit(limit);
}
/** Bills the month once: a charge for the current month if there is none yet (a $0 line when the discount is 100%). */
export async function billThisMonth(db: Database, now = new Date()) {
  const state = await getPlanState(db);
  if (state.plan === "free") return null;
  const label = `${PLANS[state.plan].name}, ${now.toISOString().slice(0, 7)}${state.discountPct ? ` (${state.discountPct}% off)` : ""}`;
  const [hit] = await db.select().from(s.studioPlanCharges).where(eq(s.studioPlanCharges.description, label));
  if (hit) return null;
  return recordPlanCharge(db, label, monthlyDue(state), undefined, now);
}
