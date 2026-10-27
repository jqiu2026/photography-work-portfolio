import { verifyLocal } from "@jerryqiu/storage";
import { NextResponse } from "next/server";
import { uploadStore } from "@/lib/storage";

/** Local-development endpoint for signed PUT uploads of screenshots (only with STORAGE_DRIVER=local). */
const enabled = () => (process.env.STORAGE_DRIVER ?? "local") === "local";

export async function PUT(req: Request, { params }: { params: Promise<{ store: string; key: string[] }> }) {
  if (!enabled()) return new NextResponse(null, { status: 404 });
  const { store, key: parts } = await params;
  if (store !== "originals") return new NextResponse(null, { status: 404 });
  const key = parts.join("/");
  const url = new URL(req.url);
  const exp = Number(url.searchParams.get("exp"));
  const sig = url.searchParams.get("sig") ?? "";
  if (
    url.searchParams.get("m") !== "PUT" ||
    !verifyLocal(process.env.AUTH_SECRET ?? "dev-only-secret", "PUT", `${store}/${key}`, exp, sig)
  )
    return new NextResponse("Forbidden", { status: 403 });
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 25 * 1024 * 1024) return new NextResponse("Bad size", { status: 400 });
  await uploadStore().put(key, bytes, { contentType: req.headers.get("content-type") ?? "application/octet-stream" });
  return new NextResponse(null, { status: 200 });
}
