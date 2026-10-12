import { safeName } from "@jerryqiu/media";
import { NextResponse } from "next/server";
import { z } from "zod";
import { guardedRoute } from "@/lib/route-guard";
import { originalsStore } from "@/lib/storage";

const body = z.object({
  filename: z.string().trim().min(1).max(200),
  size: z
    .number()
    .int()
    .min(1)
    .max(60 * 1024 * 1024),
  type: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/tiff"]),
  replaceId: z.string().uuid().optional(),
});

/**
 * Step 1 of a direct upload: returns a short-lived signed PUT URL so the browser sends the file straight to storage
 * (Vercel functions cap request bodies at 4.5 MB, far below a photograph). Nothing is trusted yet: the type, size and
 * actual image bytes are validated again when the upload is finalized.
 */
export const POST = guardedRoute(
  "media.write",
  async (req) => {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Unsupported file. Use a JPEG, PNG, WebP, AVIF, GIF or TIFF under 60 MB." },
        { status: 400 },
      );
    const { filename, type, replaceId } = parsed.data;
    const id = replaceId ?? crypto.randomUUID();
    const key = `orig/${id}/${safeName(filename)}`;
    const uploadUrl = await originalsStore().getSignedUrl(key, { expiresIn: 600, method: "PUT", contentType: type });
    return NextResponse.json({ id, key, uploadUrl, contentType: type });
  },
  { limit: 120 },
);
