import { getDb } from "@jerryqiu/db";
import { tracksByIds } from "@jerryqiu/db/gallery-extras";
import { portalSession } from "@/lib/portal";
import { originalsStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** A music track for someone who has opened a gallery (a visitor or the client). Supports byte ranges so every browser can seek. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const none = new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!db || !/^[0-9a-f-]{36}$/i.test(id) || !(await portalSession())) return none;
  const [track] = await tracksByIds(db, [id]);
  const obj = track ? await originalsStore().get(track.storageKey) : null;
  if (!track || !obj) return none;
  const total = obj.body.byteLength;
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  const headers = { "Content-Type": track.mime, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600" };
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = Math.min(total - 1, range[2] ? Number(range[2]) : total - 1);
    if (start > end || start >= total)
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
    return new Response(new Uint8Array(obj.body.slice(start, end + 1)), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }
  return new Response(new Uint8Array(obj.body), { headers: { ...headers, "Content-Length": String(total) } });
}
