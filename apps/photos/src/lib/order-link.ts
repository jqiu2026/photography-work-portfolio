import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { tokenSecrets } from "@jerryqiu/protect";
import { getSite } from "@jerryqiu/sites";

const mac = (secret: string, id: string) => createHmac("sha256", secret).update(`order.${id}`).digest("base64url");

/**
 * The buyer's link to their order and downloads: `<order id>.<signature>`. Derived, not stored, so the payment webhook and the
 * checkout page produce the same link and the receipt email can carry it. Without the signature the id opens nothing.
 */
export function orderLink(orderId: string): string {
  const secret = tokenSecrets()[0];
  if (!secret) throw new Error("No signing secret configured");
  return `${orderId}.${mac(secret, orderId)}`;
}
export function verifyOrderLink(token: string): string | null {
  if (token.length > 120) return null;
  const [id, sig, extra] = token.split(".");
  if (!id || !sig || extra !== undefined || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const got = Buffer.from(sig);
  const ok = tokenSecrets().some((s) => {
    const want = Buffer.from(mac(s, id));
    return want.length === got.length && timingSafeEqual(want, got);
  });
  return ok ? id : null;
}
export const orderUrl = (orderId: string) => `${getSite("photos").url}/g/order/${orderLink(orderId)}`;
