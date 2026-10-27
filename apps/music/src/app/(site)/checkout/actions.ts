"use server";

import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { StudioError } from "@jerryqiu/db/studio";
import { redirect } from "next/navigation";
import { readCart, writeCart } from "@/lib/cart";
import { afterOrderPaid, mocksOn, startPayment } from "@/lib/checkout";
import { allow } from "@/lib/public-action";

export type CheckoutState = { ok: false; error: string; fieldErrors?: Record<string, string> } | null;

export async function checkoutAction(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  if (!(await allow("checkout", 12, 3600))) return { ok: false, error: "Too many tries. Please wait a while." };
  const db = getDb();
  if (!db) return { ok: false, error: "Checkout is not open yet." };
  const ids = await readCart();
  if (!ids.length) return { ok: false, error: "Your cart is empty." };
  const input = {
    email: String(form.get("email") ?? ""),
    holderName: String(form.get("name") ?? ""),
    organization: String(form.get("organization") ?? "").trim() || null,
    productIds: ids,
  };
  const parsed = m.orderInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0] === "holderName" ? "name" : String(i.path[0]);
      fieldErrors[k] ??= k === "email" ? "Enter a valid email." : "Fill in this field.";
    }
    return { ok: false, error: "Check the highlighted fields.", fieldErrors };
  }
  let to: string;
  try {
    const o = await m.createOrder(db, parsed.data);
    const r = await startPayment(
      o.order,
      o.token,
      o.lines.map((l) => l.title),
    );
    if ("error" in r) return { ok: false, error: r.error };
    await writeCart([]);
    to = r.redirect;
  } catch (e) {
    if (e instanceof StudioError) return { ok: false, error: e.message };
    console.error("[music] checkout failed", e);
    return { ok: false, error: "Something went wrong. Nothing was charged. Please try again." };
  }
  redirect(to);
}

/** The labeled MOCK payment (development and previews only): marks the order paid exactly as the Stripe webhook would. */
export async function mockPayAction(form: FormData) {
  if (!mocksOn()) return;
  const db = getDb();
  const token = String(form.get("token") ?? "");
  if (!db) return;
  const found = await m.orderByAccessToken(db, token);
  if (!found || found.order.status !== "pending") redirect(`/order/${encodeURIComponent(token)}`);
  const r = await m.markOrderPaid(db, found.order.id, { provider: "mock", providerRef: `mock_${found.order.id}` });
  if (!r.duplicate) await afterOrderPaid(db, found.order.id, token);
  redirect(`/order/${encodeURIComponent(token)}`);
}
