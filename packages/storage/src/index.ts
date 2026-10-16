import os from "node:os";
import path from "node:path";
import { blobProvider } from "./blob";
import { localStorageProvider } from "./local";
import { r2Provider } from "./r2";
import type { StorageProvider } from "./types";

export * from "./types";
export { signLocal, verifyLocal } from "./signing";
export { localStorageProvider, r2Provider, blobProvider };

export type Store = "originals" | "public";

/**
 * Env:
 *   STORAGE_DRIVER   local | r2 | blob   (default local; "blob" holds originals under a private/ prefix, see below)
 *   STORAGE_DIR      local directory (default ~/.jerryqiu-dev/storage, outside the repo so dev rebuilds are not triggered)
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_ORIGINALS, R2_BUCKET_PUBLIC
 *   BLOB_READ_WRITE_TOKEN
 * Missing credentials never crash: the factory falls back to local storage and warns once.
 */
const warned = new Set<string>();
const warn = (msg: string) => {
  if (!warned.has(msg)) {
    warned.add(msg);
    console.warn(`[storage] ${msg}`);
  }
};

export function createStorage(store: Store, env: Record<string, string | undefined> = process.env): StorageProvider {
  const driver = (env.STORAGE_DRIVER ?? "local") as "local" | "r2" | "blob";
  const secret = env.AUTH_SECRET ?? "dev-only-secret";
  const local = () =>
    localStorageProvider({
      dir: env.STORAGE_DIR ?? path.join(os.homedir(), ".jerryqiu-dev", "storage"),
      secret,
      baseUrl: (env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:3000").replace(/\/$/, ""),
      store,
    });
  if (driver === "r2") {
    const bucket = store === "originals" ? env.R2_BUCKET_ORIGINALS : env.R2_BUCKET_PUBLIC;
    if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && bucket) {
      return r2Provider({
        accountId: env.R2_ACCOUNT_ID,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket,
      });
    }
    warn("STORAGE_DRIVER=r2 but R2 credentials/buckets are incomplete; using local storage.");
    return local();
  }
  if (driver === "blob") {
    // Vercel Blob only (owner decision Q51). Objects are public by URL, so originals live under a "private/" prefix with
    // random-id keys (`orig/<uuid>/...`) and are NEVER linked or returned to a browser: they are read server-side only
    // (downloads and derivatives go through our routes). That is capability-URL privacy, not access control: say so.
    if (env.BLOB_READ_WRITE_TOKEN)
      return blobProvider({ token: env.BLOB_READ_WRITE_TOKEN, prefix: store === "originals" ? "private/" : "" });
    warn("STORAGE_DRIVER=blob but BLOB_READ_WRITE_TOKEN is missing; using local storage.");
  }
  return local();
}
