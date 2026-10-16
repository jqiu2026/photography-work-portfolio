import { getDb, hitRateLimit, schema } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import * as shop from "@jerryqiu/db/gallery-shop";
import { zipStream } from "@jerryqiu/media";
import { clientIpHash } from "@jerryqiu/protect";
import { eq } from "drizzle-orm";
import { baseName, zipPlan } from "@/lib/downloads";
import { fullFile, webFile } from "@/lib/gallery-files";
import { verifyOrderLink } from "@/lib/order-link";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const deny = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Downloads a buyer paid for: only the photographs and sizes in their paid order, or the whole gallery's ZIP parts when they
 * bought it. Web copies carry an invisible mark naming the order.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const u = new URL(request.url);
  const db = getDb();
  const id = verifyOrderLink(token);
  if (!db || !id) return deny(404, "Not found.");
  const [order] = await db.select().from(schema.studioOrders).where(eq(schema.studioOrders.id, id));
  if (!order || (order.status !== "paid" && order.status !== "fulfilled"))
    return deny(403, "This order is not paid yet.");
  const ip = clientIpHash(request.headers);
  if (!(await hitRateLimit(db, `odl:${ip}`, 100, 600)).allowed)
    return deny(429, "Too many downloads. Wait a few minutes.");
  const ent = shop.entitlements(await shop.orderItems(db, order.id));
  const contents = await gal.galleryContents(db, order.galleryId);
  const viewer = `order.${order.id}`;
  const size = u.searchParams.get("size") === "full" ? "full" : "web";
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex",
  };

  if (u.searchParams.get("zip") === "1") {
    if (!ent.all || size !== "full") return deny(403, "The whole gallery is not part of this order.");
    const parts = zipPlan(
      contents.map((c) => ({ mediaId: c.media.id, filename: c.media.filename, bytes: c.media.bytes })),
      "full",
    );
    const part = Number(u.searchParams.get("part") ?? "1");
    if (!Number.isInteger(part) || part < 1 || part > parts.length) return deny(404, "No such part.");
    await gal.logDownload(db, { galleryId: order.galleryId, kind: "zip-full", part, viewer, ipHash: ip });
    const stream = zipStream(
      parts[part - 1].map((it) => ({
        name: it.filename,
        read: async () => {
          const f = await fullFile(contents, it.mediaId);
          return f ? new Uint8Array(f.bytes) : new Uint8Array();
        },
      })),
    );
    return new Response(stream, {
      headers: {
        ...headers,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${order.number}-part-${part}-of-${parts.length}.zip"`,
      },
    });
  }

  const mediaId = u.searchParams.get("m") ?? "";
  const allowed = ent.all || ent.per.some((e) => e.mediaId === mediaId && (e.size === size || e.size === "full"));
  if (!allowed) return deny(403, "That photograph is not part of this order.");
  const f = size === "full" ? await fullFile(contents, mediaId) : await webFile(contents, mediaId, viewer);
  if (!f) return deny(404, "That photograph is not available.");
  await gal.logDownload(db, {
    galleryId: order.galleryId,
    mediaId,
    kind: size,
    viewer,
    ipHash: ip,
    bytes: f.bytes.length,
  });
  return new Response(new Uint8Array(f.bytes), {
    headers: {
      ...headers,
      "Content-Type": "type" in f ? String(f.type) : "image/jpeg",
      "Content-Disposition": `attachment; filename="${baseName(f.name).replace(/"/g, "")}${size === "full" ? f.name.slice(baseName(f.name).length) : ".jpg"}"`,
      "Content-Length": String(f.bytes.length),
    },
  });
}
