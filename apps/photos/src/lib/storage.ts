import { type StorageProvider, createStorage } from "@jerryqiu/storage";

let publicStore: StorageProvider | undefined;

/** Public-safe derivatives (downscaled, metadata stripped). Originals are never reachable from this app. */
export function derivativesStore(): StorageProvider {
  publicStore ??= createStorage("public");
  return publicStore;
}
