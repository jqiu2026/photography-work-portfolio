"use server";

import { getDb, hitRateLimit } from "@jerryqiu/db";
import * as forms from "@jerryqiu/db/forms";
import { StudioError } from "@jerryqiu/db/studio";
import { requestIpHash } from "@/lib/portal";

export type QResult = { ok: true; message: string } | { ok: false; error: string };

/** Public (link holder): saves the answers once. Validated against the questions that were sent. */
export async function submitQuestionnaireAction(token: string, answers: Record<string, string>): Promise<QResult> {
  const db = getDb();
  if (!db || token.length > 80) return { ok: false, error: "This is not available right now." };
  const ip = await requestIpHash();
  if (!(await hitRateLimit(db, `questionnaire:${ip}`, 20, 600)).allowed)
    return { ok: false, error: "Too many tries. Wait a few minutes." };
  try {
    await forms.submitQuestionnaire(db, token, answers);
    return { ok: true, message: "Thank you. Your answers are saved." };
  } catch (e) {
    return { ok: false, error: e instanceof StudioError ? e.message : "Could not save your answers." };
  }
}
