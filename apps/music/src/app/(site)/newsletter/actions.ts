"use server";

import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { sendConfirmSubscription } from "@/lib/mail";
import { allow } from "@/lib/public-action";

export type FormState = { ok: true; message: string } | { ok: false; error: string } | null;

export async function subscribeAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await allow("subscribe", 5, 3600))) return { ok: false, error: "Too many tries. Please wait a while." };
  const db = getDb();
  if (!db) return { ok: false, error: "Sign-ups are not open yet." };
  const email = String(form.get("email") ?? "");
  try {
    const r = await m.subscribe(db, email);
    if (r.status === "pending") await sendConfirmSubscription(r.email, r.token);
  } catch {
    return { ok: false, error: "Check the email address." };
  }
  // The same answer whether or not the address was already on the list.
  return { ok: true, message: "Check your email and press the link to confirm." };
}

export async function confirmAction(form: FormData) {
  const db = getDb();
  const token = String(form.get("token") ?? "");
  return db ? Boolean(await m.confirmSubscription(db, token)) : false;
}

export async function unsubscribeAction(form: FormData) {
  const db = getDb();
  const token = String(form.get("token") ?? "");
  return db ? Boolean(await m.unsubscribe(db, token)) : false;
}
