import "server-only";
import { cookies } from "next/headers";

/**
 * The cart is a list of product ids in an httpOnly cookie. It holds no prices and no trust: every id is checked against
 * the catalog (and the rights rule) when the order is made.
 */
const NAME = "mu_cart";
const MAX = 40;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readCart(): Promise<string[]> {
  const raw = (await cookies()).get(NAME)?.value;
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v)
      ? [...new Set(v.filter((x): x is string => typeof x === "string" && UUID.test(x)))].slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

export async function writeCart(ids: string[]) {
  const jar = await cookies();
  const clean = [...new Set(ids)].slice(0, MAX);
  if (!clean.length) jar.delete(NAME);
  else
    jar.set(NAME, JSON.stringify(clean), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
}
