import { NextResponse } from "next/server";
import { z } from "zod";
import { guardedRoute } from "@/lib/route-guard";
import { safeKeyName } from "@/lib/safe-name";
import { uploadStore } from "@/lib/storage";

const body = z.object({
  projectId: z.string().uuid(),
  filename: z.string().trim().min(1).max(200),
  size: z
    .number()
    .int()
    .min(1)
    .max(25 * 1024 * 1024),
  type: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
});

/** Step 1 of a screenshot upload: where to send the file (signed PUT in development, Vercel Blob in production). */
export const POST = guardedRoute(
  "studio.access",
  async (req) => {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json({ error: "Use a PNG, JPEG, WebP or GIF under 25 MB." }, { status: 400 });
    const { projectId, filename, type } = parsed.data;
    const id = crypto.randomUUID();
    const key = `shots/${id}/${safeKeyName(filename)}`;
    if ((process.env.STORAGE_DRIVER ?? "local") === "blob")
      return NextResponse.json({ mode: "blob", id, key, projectId, contentType: type });
    const uploadUrl = await uploadStore().getSignedUrl(key, { expiresIn: 600, method: "PUT", contentType: type });
    return NextResponse.json({ mode: "signed", id, key, projectId, uploadUrl, contentType: type });
  },
  { limit: 300 },
);
