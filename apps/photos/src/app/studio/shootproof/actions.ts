"use server";

import { getDb, writeAudit } from "@jerryqiu/db";
import { disconnect, importEvent, purgeExpiredExternal, removeCached, sourceFromEnv } from "@jerryqiu/shootproof";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/auth";
import { derivativesStore } from "@/lib/storage";

const BACK = "/studio/shootproof";
const idPart = z.string().regex(/^[\w-]{1,40}$/);

async function ctx() {
  const user = await requireUser("shootproof.manage");
  const db = getDb();
  const s = sourceFromEnv();
  if (!db || s.state !== "ready") redirect(`${BACK}?error=${encodeURIComponent("ShootProof is not set up")}`);
  return { user, db, source: s.source };
}

export async function importAction(formData: FormData) {
  const { user, db, source } = await ctx();
  const brand = idPart.safeParse(formData.get("brandId"));
  const event = idPart.safeParse(formData.get("eventId"));
  if (!brand.success || !event.success) redirect(`${BACK}?error=${encodeURIComponent("Choose an event")}`);
  let q: string;
  try {
    const r = await importEvent(
      { db, store: derivativesStore(), source },
      (brand as { data: string }).data,
      (event as { data: string }).data,
    );
    await writeAudit(db, {
      actor: user.email,
      action: "shootproof.import",
      entity: "external_cache",
      entityId: `${(brand as { data: string }).data}:${(event as { data: string }).data}`,
      site: "photos",
      summary: `Imported ${r.imported} ShootProof photo(s) for temporary display`,
    });
    q = `imported=${r.imported}&failed=${r.failed}${r.capped ? "&capped=1" : ""}`;
  } catch (error) {
    console.error("[shootproof] import failed", String(error));
    q = `error=${encodeURIComponent("The import failed. Check the connection and try again.")}`;
  }
  redirect(`${BACK}?${q}`);
}

export async function removeAction(formData: FormData) {
  const { user, db } = await ctx();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (id.success && (await removeCached(db, derivativesStore(), id.data)))
    await writeAudit(db, {
      actor: user.email,
      action: "shootproof.remove",
      entity: "external_cache",
      entityId: id.data,
      site: "photos",
      summary: "Removed an imported photo",
    });
  redirect(BACK);
}

export async function purgeExpiredAction() {
  const { user, db } = await ctx();
  const n = await purgeExpiredExternal(db, derivativesStore());
  await writeAudit(db, {
    actor: user.email,
    action: "shootproof.purge",
    entity: "external_cache",
    site: "photos",
    summary: `Purged ${n} expired imported photo(s)`,
  });
  redirect(`${BACK}?purged=${n}`);
}

export async function disconnectAction() {
  const { user, db } = await ctx();
  await disconnect(db);
  await writeAudit(db, {
    actor: user.email,
    action: "shootproof.disconnect",
    entity: "external_connection",
    entityId: "shootproof",
    site: "photos",
    summary: "Disconnected ShootProof",
  });
  redirect(BACK);
}
