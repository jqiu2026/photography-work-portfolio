import { AuthorizationError } from "@jerryqiu/auth/server";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/auth";

/** Vercel Blob client uploads (production), for signed-in studio users only, images under 25 MB. TODO(owner): needs BLOB_READ_WRITE_TOKEN. */
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
        if (!/^private\/shots\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,200}$/.test(pathname))
          throw new Error("Unexpected upload path.");
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
