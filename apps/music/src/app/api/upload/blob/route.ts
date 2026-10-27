import { AuthorizationError } from "@jerryqiu/auth/server";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/auth";

/**
 * Vercel Blob client uploads (production). The browser asks this route for a short-lived upload token; the token is only
 * issued to a signed-in studio user, for a path under `private/scores/<uuid>/`, at most 60 MB. TODO(owner): needs
 * BLOB_READ_WRITE_TOKEN. Never run against the live service in development or tests.
 */
export async function POST(request: Request) {
  if ((process.env.STORAGE_DRIVER ?? "local") !== "blob" || !process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json({ error: "Blob storage is not configured." }, { status: 404 });
  try {
    await requireUser("studio.access");
  } catch (e) {
    if (e instanceof AuthorizationError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^private\/scores\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,200}$/.test(pathname))
          throw new Error("Unexpected upload path.");
        return { maximumSizeInBytes: 60 * 1024 * 1024, addRandomSuffix: false, allowOverwrite: false };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
