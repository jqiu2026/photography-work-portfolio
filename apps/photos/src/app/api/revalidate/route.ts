import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const body = z.object({
  tags: z.array(z.enum(["galleries", "media", "settings", "redirects", "pages"])).max(8),
  paths: z
    .array(z.string().regex(/^\/[A-Za-z0-9/_-]{0,100}$/))
    .max(8)
    .default([]),
});

/** The hub calls this after a CMS change so the separately deployed photography site refreshes within seconds. */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || secret.length < 16) return new Response("Not configured", { status: 503 });
  const given = Buffer.from((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(secret);
  if (given.length !== want.length || !timingSafeEqual(given, want))
    return new Response("Unauthorized", { status: 401 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  for (const t of parsed.data.tags) revalidateTag(t, { expire: 0 });
  for (const p of parsed.data.paths) revalidatePath(p);
  return Response.json({ ok: true });
}
