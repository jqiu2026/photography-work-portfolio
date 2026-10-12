import "server-only";
import { getDb } from "@jerryqiu/db";
import { accessToken, sourceFromEnv } from "@jerryqiu/shootproof";

/** A usable ShootProof access token, or null when not connected. Server-only: never a Server Action. */
export async function connectedToken() {
  const db = getDb();
  const s = sourceFromEnv();
  if (!db || s.state !== "ready") return null;
  return accessToken(db, s.source);
}
