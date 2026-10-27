"use server";

import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { redirect } from "next/navigation";
import { sendSignInLink } from "@/lib/mail";
import { allow } from "@/lib/public-action";
import { endSession, startSession } from "@/lib/session";

export type LinkState = { ok: boolean; message: string } | null;

/** Always answers the same: it never says whether an address has bought anything. */
export async function requestLinkAction(_prev: LinkState, form: FormData): Promise<LinkState> {
  if (!(await allow("signin", 6, 3600))) return { ok: false, message: "Too many tries. Please wait a while." };
  const db = getDb();
  const email = String(form.get("email") ?? "");
  if (db && email.includes("@")) {
    const l = await m.createBuyerLink(db, email);
    if (l) await sendSignInLink(l.buyer.email, l.token);
  }
  return {
    ok: true,
    message: "If that address has bought a score, a sign-in link is on its way. It works once, for 30 minutes.",
  };
}

export async function verifyAction(form: FormData) {
  const db = getDb();
  const buyer = db ? await m.consumeBuyerLink(db, String(form.get("token") ?? "")) : null;
  if (!buyer) redirect("/library/verify?failed=1");
  await startSession(buyer.id);
  redirect("/library");
}

export async function signOutAction() {
  await endSession();
  redirect("/library");
}
