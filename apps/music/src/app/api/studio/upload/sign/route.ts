import { NextResponse } from "next/server";
import { z } from "zod";
import { guardedRoute } from "@/lib/route-guard";
import { safeKeyName } from "@/lib/safe-name";
import { scoreStore } from "@/lib/storage";

const body = z.object({
  workId: z.string().uuid(),
  filename: z.string().trim().min(1).max(200),
  size: z
    .number()
    .int()
    .min(1)
    .max(60 * 1024 * 1024),
  type: z.string().trim().min(3).max(100),
});

/** Step 1 of a score upload: where to send the file (a signed PUT in development, Vercel Blob in production). */
export const POST = guardedRoute(
  "studio.access",
  async (req) => {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Use a file under 60 MB." }, { status: 400 });
    const { workId, filename, type } = parsed.data;
    const id = crypto.randomUUID();
    const key = `scores/${id}/${safeKeyName(filename)}`;
    if ((process.env.STORAGE_DRIVER ?? "local") === "blob")
      return NextResponse.json({ mode: "blob", id, key, workId, contentType: type });
    const uploadUrl = await scoreStore().getSignedUrl(key, { expiresIn: 600, method: "PUT", contentType: type });
    return NextResponse.json({ mode: "signed", id, key, workId, uploadUrl, contentType: type });
  },
  { limit: 300 },
);
