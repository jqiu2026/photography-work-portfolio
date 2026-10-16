import { getDb } from "@jerryqiu/db";

export const dynamic = "force-dynamic";

/** Public liveness check: no secrets, no config detail. The detailed page is /studio/health (owner only). */
export async function GET() {
  const db = getDb();
  let dbOk = false;
  if (db)
    dbOk = await db.execute("select 1" as never).then(
      () => true,
      () => false,
    );
  return Response.json(
    { ok: true, database: db ? dbOk : null },
    { status: dbOk || !db ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
