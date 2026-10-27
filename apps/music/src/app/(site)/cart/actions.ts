"use server";

import { readCart, writeCart } from "@/lib/cart";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addToCartAction(productId: string): Promise<{ ok: boolean; count: number }> {
  if (!UUID.test(productId)) return { ok: false, count: (await readCart()).length };
  const cart = await readCart();
  if (!cart.includes(productId)) cart.push(productId);
  await writeCart(cart);
  return { ok: true, count: cart.length };
}

export async function removeFromCartAction(productId: string): Promise<{ count: number }> {
  const cart = (await readCart()).filter((id) => id !== productId);
  await writeCart(cart);
  return { count: cart.length };
}
