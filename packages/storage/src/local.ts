import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { signLocal } from "./signing";
import { type StorageProvider, assertSafeKey } from "./types";

const MIME: Record<string, string> = {
  webp: "image/webp",
  avif: "image/avif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  pdf: "application/pdf",
};

/** Filesystem storage for local development. Content type is derived from the extension. */
export function localStorageProvider(opts: {
  dir: string;
  secret: string;
  baseUrl: string;
  store: string;
}): StorageProvider {
  const root = path.resolve(opts.dir, opts.store);
  const file = (key: string) => {
    assertSafeKey(key);
    const p = path.resolve(root, key);
    if (!p.startsWith(`${root}${path.sep}`)) throw new Error("Key escapes the storage root");
    return p;
  };
  const typeOf = (key: string) => MIME[key.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
  return {
    name: "local",
    async put(key, body) {
      const p = file(key);
      await mkdir(path.dirname(p), { recursive: true });
      await writeFile(p, body);
    },
    async get(key) {
      try {
        return { body: new Uint8Array(await readFile(file(key))), contentType: typeOf(key) };
      } catch {
        return null;
      }
    },
    async head(key) {
      try {
        return { bytes: (await stat(file(key))).size, contentType: typeOf(key) };
      } catch {
        return null;
      }
    },
    async delete(key) {
      await rm(file(key), { force: true });
    },
    async list(prefix) {
      const base = path.resolve(root, prefix || ".");
      const out: { key: string; bytes: number }[] = [];
      const walk = async (dir: string) => {
        let entries: import("node:fs").Dirent[] = [];
        try {
          entries = await readdir(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const e of entries) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) await walk(p);
          else out.push({ key: path.relative(root, p).split(path.sep).join("/"), bytes: (await stat(p)).size });
        }
      };
      await walk(base);
      return out;
    },
    async getSignedUrl(key, { expiresIn, method }) {
      assertSafeKey(key);
      const exp = Math.floor(Date.now() / 1000) + expiresIn;
      const sig = signLocal(opts.secret, method, `${opts.store}/${key}`, exp);
      return `${opts.baseUrl}/api/storage/${opts.store}/${key}?exp=${exp}&m=${method}&sig=${sig}`;
    },
  };
}
