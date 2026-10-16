import { type StorageProvider, createStorage } from "@jerryqiu/storage";
import { getSite } from "@jerryqiu/sites";

let publicStore: StorageProvider | undefined;
let originals: StorageProvider | undefined;

/** Public-safe derivatives (downscaled, metadata stripped). Originals are never served from here. */
export function derivativesStore(): StorageProvider {
  publicStore ??= createStorage("public");
  return publicStore;
}

/**
 * Private originals: read server-side only (derivative generation and the download routes), never linked. With the local
 * driver, signed upload URLs point back at this app's own storage route (`/api/storage/...`).
 */
export function originalsStore(): StorageProvider {
  originals ??= createStorage("originals", { ...process.env, NEXT_PUBLIC_HUB_URL: getSite("photos").url });
  return originals;
}
