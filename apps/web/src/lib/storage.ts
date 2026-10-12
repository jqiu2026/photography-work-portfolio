import { type StorageProvider, createStorage } from "@jerryqiu/storage";

let originals: StorageProvider | undefined;
let publicStore: StorageProvider | undefined;

/** Private originals: never served directly. */
export function originalsStore(): StorageProvider {
  originals ??= createStorage("originals");
  return originals;
}

/** Public-safe derivatives (downscaled, metadata stripped). */
export function derivativesStore(): StorageProvider {
  publicStore ??= createStorage("public");
  return publicStore;
}
