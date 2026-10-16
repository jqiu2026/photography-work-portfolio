import { getDb } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import * as shop from "@jerryqiu/db/gallery-shop";
import { tokenSecrets } from "@jerryqiu/protect";
import { verifyFileLink } from "@jerryqiu/prints";
import { eq } from "drizzle-orm";
import { schema } from "@jerryqiu/db";
import { fullFile } from "@/lib/gallery-files";
import { printItems } from "@/lib/shop-fulfil";

export const dynamic = "force-dynamic";

/**
 * The print lab fetches the original file here. The link is signed for one order item and expires after two weeks; it only
 * works for a PAID order, and returns nothing else about the gallery.
 */
export async function GET(request: Request, { params }: { params: Promise<{ order: string; index: string }> }) {
  const { order: orderId, index } = await params;
  const u = new URL(request.url);
  const i = Number(index);
  const exp = Number(u.searchParams.get("e"));
  const sig = u.searchParams.get("s") ?? "";
  const db = getDb();
  const nope = new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!db || !/^[0-9a-f-]{36}$/i.test(orderId) || !Number.isInteger(i) || i < 0) return nope;
  if (!tokenSecrets().some((s) => verifyFileLink(s, orderId, i, exp, sig))) return nope;
  const [o] = await db.select().from(schema.studioOrders).where(eq(schema.studioOrders.id, orderId));
  if (!o || (o.status !== "paid" && o.status !== "fulfilled")) return nope;
  const it = printItems(await shop.orderItems(db, o.id))[i];
  if (!it?.mediaId) return nope;
  const f = await fullFile(await gal.galleryContents(db, o.galleryId), it.mediaId);
  if (!f) return nope;
  return new Response(new Uint8Array(f.bytes), {
    headers: { "Content-Type": f.type, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}
