import { type Database, schema } from "@jerryqiu/db";
import { type Rendered, type TemplateData, type TemplateKind, oneLine, renderEmail } from "./templates";

export * from "./templates";

/**
 * Email behind an interface. `ResendProvider` is the real adapter (RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO: names only
 * in .env.example). Without a key, development and previews use the labelled MOCK outbox (the email_log table, nothing
 * leaves the machine); a production build without a key records `skipped` and never pretends to have sent anything.
 * Every send, real or not, is written to email_log so the studio inbox and the client portal can show the thread.
 */
export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  from?: string;
};
export type SendResult = { ok: boolean; id?: string; error?: string };
export interface EmailProvider {
  readonly name: "resend" | "mock" | "none";
  send(mail: OutgoingEmail & { from: string }): Promise<SendResult>;
}

type Env = Record<string, string | undefined>;
const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

export function createResendProvider(apiKey: string, fetchImpl: typeof fetch = fetch): EmailProvider {
  return {
    name: "resend",
    async send(m) {
      try {
        const res = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: m.from,
            to: [m.to],
            subject: oneLine(m.subject).slice(0, 200),
            text: m.text,
            html: m.html,
            ...(m.replyTo ? { reply_to: m.replyTo } : {}),
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
        return res.ok
          ? { ok: true, id: j.id }
          : { ok: false, error: `Resend ${res.status}: ${j.message ?? "rejected"}` };
      } catch (error) {
        return { ok: false, error: String(error).slice(0, 300) };
      }
    },
  };
}

/** MOCK: records nothing itself (the log row is the outbox) and reports success. Never constructed in production builds. */
export function createMockProvider(): EmailProvider {
  return { name: "mock", send: async () => ({ ok: true }) };
}

export const emailMockEnabled = (env: Env = process.env) =>
  env.ENABLE_MOCKS === "true" || env.NODE_ENV !== "production";

export function providerFromEnv(env: Env = process.env, fetchImpl?: typeof fetch): EmailProvider {
  const key = env.RESEND_API_KEY?.trim();
  if (key && env.EMAIL_FROM?.trim()) return createResendProvider(key, fetchImpl);
  if (emailMockEnabled(env)) return createMockProvider();
  return {
    name: "none",
    send: async () => ({
      ok: false,
      error: "No email provider configured (TODO(owner): needs RESEND_API_KEY and EMAIL_FROM)",
    }),
  };
}

export type Related = { type: string; id: string };

/** Sends (or records) one email and logs it. Never throws; a failure is logged and returned. */
export async function sendEmail(
  db: Database | null,
  mail: OutgoingEmail,
  opts: { kind: TemplateKind | string; related?: Related; env?: Env; provider?: EmailProvider } = { kind: "reply" },
): Promise<SendResult & { status: "sent" | "mock" | "skipped" | "failed" }> {
  const env = opts.env ?? process.env;
  const provider = opts.provider ?? providerFromEnv(env);
  const from = mail.from ?? env.EMAIL_FROM?.trim() ?? "Jerry Qiu Photography <studio@photo.invalid>";
  const replyTo = mail.replyTo ?? env.EMAIL_REPLY_TO?.trim() ?? env.CONTACT_TO_EMAIL?.trim();
  const to = mail.to.trim();
  let result: SendResult;
  if (!EMAIL.test(to)) result = { ok: false, error: "Invalid recipient address" };
  else result = await provider.send({ ...mail, to, from, replyTo });
  const status = result.ok
    ? provider.name === "mock"
      ? "mock"
      : "sent"
    : provider.name === "none"
      ? "skipped"
      : "failed";
  if (db)
    await db
      .insert(schema.emailLog)
      .values({
        kind: opts.kind,
        toEmail: to.toLowerCase().slice(0, 320),
        fromEmail: from,
        replyTo: replyTo ?? null,
        subject: oneLine(mail.subject).slice(0, 200),
        bodyText: mail.text,
        bodyHtml: mail.html ?? null,
        provider: provider.name,
        status,
        providerId: result.id ?? null,
        error: result.error ?? null,
        relatedType: opts.related?.type ?? null,
        relatedId: opts.related?.id ?? null,
      })
      .catch((error) => console.error("[email] could not log", String(error)));
  if (!result.ok && status === "failed") console.error("[email] send failed", result.error);
  return { ...result, status };
}

/** Render a template and send it. */
export async function sendTemplate(
  db: Database | null,
  to: string,
  kind: TemplateKind,
  data: TemplateData,
  opts: { related?: Related; env?: Env; provider?: EmailProvider; replyTo?: string } = {},
) {
  const r: Rendered = renderEmail(kind, data);
  return sendEmail(
    db,
    { to, subject: r.subject, text: r.text, html: r.html, replyTo: opts.replyTo },
    { kind, ...opts },
  );
}
