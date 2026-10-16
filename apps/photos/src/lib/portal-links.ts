import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { tokenSecrets } from "@jerryqiu/protect";
import { accountSession } from "@/lib/account-session";

/** Document link tokens are 32 base64url characters; a portal capability is longer. Pages and actions refuse anything longer. */
export const MAX_TOKEN = 400;
type Kind = "invoice" | "contract" | "quote" | "questionnaire";

const mac = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("base64url");

/**
 * A link a signed-in client can open for one of THEIR documents without the emailed token: `p.<kind>.<id>.<account>.<exp>.<sig>`.
 * It only works for that account's session and expires after 2 hours. The old emailed links keep working.
 */
export function portalRef(kind: Kind, id: string, accountId: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + 2 * 60 * 60;
  const body = `${kind}.${id}.${accountId}.${exp}`;
  const secret = tokenSecrets()[0];
  if (!secret) throw new Error("No signing secret configured");
  return `p.${body}.${mac(secret, body)}`;
}

/**
 * Turns the token in a URL into what the database layer accepts: a raw link token as is, or `id:<uuid>` after verifying a
 * portal capability for the signed-in account. Anything else (including a hand-typed `id:` value) is refused (null).
 */
export async function resolveRef(token: string, kind: Kind): Promise<string | null> {
  if (!token || token.length > MAX_TOKEN) return null;
  if (!token.startsWith("p.")) return /^[A-Za-z0-9_-]+$/.test(token) ? token : null;
  const [, k, id, account, exp, sig, extra] = token.split(".");
  if (extra !== undefined || k !== kind || !id || !account || !exp || !sig) return null;
  const body = `${k}.${id}.${account}.${exp}`;
  const got = Buffer.from(sig);
  const valid = tokenSecrets().some((s) => {
    const want = Buffer.from(mac(s, body));
    return want.length === got.length && timingSafeEqual(want, got);
  });
  if (!valid || Number(exp) * 1000 < Date.now() || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const me = await accountSession();
  return me && me.account.id === account ? `id:${id}` : null;
}
