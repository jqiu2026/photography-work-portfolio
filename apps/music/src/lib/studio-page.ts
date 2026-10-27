import "server-only";
import { getDb } from "@jerryqiu/db";
import { requirePageUser } from "@/auth";

/** Every studio page starts here: signed-in staff with studio access, and a database. */
export async function studioPage() {
  const user = await requirePageUser("studio.access", "/studio");
  const db = getDb();
  return { user, db };
}
