import { verifyLocal } from "@jerryqiu/storage";
import { NextResponse } from "next/server";
import { derivativesStore, originalsStore } from "@/lib/storage";

/**
 * Local-development storage endpoint for signed URLs (PUT uploads, GET reads). Active only when STORAGE_DRIVER is local;
 * with R2 the browser talks to R2 directly and this route does not exist. The HMAC covers store, key, method and expiry.
 */
const enabled = () => (process.env.STORAGE_DRIVER ?? "local") === "local";

async function handle(req: Request, params: Promise<{ store: string; key: string[] }>, method: "GET" | "PUT") {
  if (!enabled()) return new NextResponse(null, { status: 404 });
  const { store, key: parts } = await params;
  if (store !== "originals" && store !== "public") return new NextResponse(null, { status: 404 });
  const key = parts.join("/");
  const url = new URL(req.url);
  const exp = Number(url.searchParams.get("exp"));
  const sig = url.searchParams.get("sig") ?? "";
  if (
    url.searchParams.get("m") !== method ||
    !verifyLocal(process.env.AUTH_SECRET ?? "dev-only-secret", method, `${store}/${key}`, exp, sig)
  )
    return new NextResponse("Forbidden", { status: 403 });
  const s = store === "originals" ? originalsStore() : derivativesStore();
  if (method === "PUT") {
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 60 * 1024 * 1024) return new NextResponse("Bad size", { status: 400 });
    await s.put(key, bytes, { contentType: req.headers.get("content-type") ?? "application/octet-stream" });
    return new NextResponse(null, { status: 200 });
  }
  const obj = await s.get(key);
  return obj
    ? new NextResponse(Buffer.from(obj.body), {
        headers: {
          "Content-Type": obj.contentType,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      })
    : new NextResponse(null, { status: 404 });
}

export const PUT = (req: Request, { params }: { params: Promise<{ store: string; key: string[] }> }) =>
  handle(req, params, "PUT");
export const GET = (req: Request, { params }: { params: Promise<{ store: string; key: string[] }> }) =>
  handle(req, params, "GET");
