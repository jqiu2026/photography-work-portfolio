import { getDb, writeAudit } from "@jerryqiu/db";
import { exportZip } from "@jerryqiu/db/export";
import { guardedRoute } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

/** Owner-only full content backup (JSON + Markdown + media manifest) as a zip. Includes inbox messages: keep it private. */
export const GET = guardedRoute(
  "users.manage",
  async (_req, _ctx, user) => {
    const db = getDb();
    if (!db) return Response.json({ error: "The database isn't set up." }, { status: 503 });
    const zip = await exportZip(db);
    await writeAudit(db, {
      actor: user.email,
      action: "export.download",
      entity: "export",
      summary: "Downloaded a full content export",
    });
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="jerryqiu-backup-${stamp}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  },
  { limit: 5 },
);
