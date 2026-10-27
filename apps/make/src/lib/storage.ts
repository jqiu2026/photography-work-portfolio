import { getMakeUrl } from "@jerryqiu/sites";
import { type StorageProvider, createStorage } from "@jerryqiu/storage";

let originals: StorageProvider | undefined;
let publicStore: StorageProvider | undefined;

/** Uploads land here first (private), are re-encoded without metadata, and the original is deleted. */
export function uploadStore(): StorageProvider {
  originals ??= createStorage("originals", { ...process.env, NEXT_PUBLIC_HUB_URL: getMakeUrl() });
  return originals;
}

/** The re-encoded screenshots that the public image route serves (only after they are marked checked). */
export function imageStore(): StorageProvider {
  publicStore ??= createStorage("public");
  return publicStore;
}
