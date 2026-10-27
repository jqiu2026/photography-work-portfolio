"use server";

import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { sendCommissionAck, sendCommissionOwner } from "@/lib/mail";
import { allow, ipHash } from "@/lib/public-action";

export type CommissionState =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

export async function commissionAction(_prev: CommissionState, form: FormData): Promise<CommissionState> {
  // A hidden field real visitors never fill in: a bot that does is told it worked and nothing is stored.
  if (String(form.get("website") ?? "")) return { ok: true, message: "Thank you. I will reply within a few days." };
  if (!(await allow("commission", 4, 3600))) return { ok: false, error: "Too many tries. Please wait a while." };
  const db = getDb();
  if (!db) return { ok: false, error: "Inquiries are not open yet. Please try again later." };
  const raw = Object.fromEntries(
    ["name", "email", "organization", "forces", "occasion", "deadline", "budget", "message"].map((k) => [
      k,
      String(form.get(k) ?? "").trim() || undefined,
    ]),
  );
  const parsed = m.commissionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues)
      fieldErrors[String(i.path[0])] ??=
        i.path[0] === "email"
          ? "Enter a valid email."
          : i.path[0] === "message"
            ? "Tell me a little more (at least 10 characters)."
            : "Check this field.";
    return { ok: false, error: "Check the highlighted fields.", fieldErrors };
  }
  const c = await m.createCommission(db, parsed.data, await ipHash());
  await Promise.all([sendCommissionOwner(parsed.data), sendCommissionAck(c.email, c.name)]);
  return { ok: true, message: "Thank you. I read every inquiry and will reply within a few days." };
}
