import { type StorageProvider, createStorage } from "@jerryqiu/storage";

let originals: StorageProvider | undefined;
let publicStore: StorageProvider | undefined;

/** Private originals: never served directly. */
export const originalsStore = () => (originals ??= createStorage("originals"));
/** Public-safe derivatives (downscaled, metadata stripped). */
export const derivativesStore = () => (publicStore ??= createStorage("public"));
