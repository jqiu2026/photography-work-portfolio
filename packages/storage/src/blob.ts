import { del, head, list, put } from "@vercel/blob";
import { type StorageProvider, assertSafeKey } from "./types";

/**
 * Vercel Blob. Objects are public-by-URL: the only protection for an original is that its key contains a random id and
 * that no code ever returns the URL to a browser (see createStorage). Use `prefix` to keep originals apart from derivatives.
 */
export function blobProvider(opts: { token: string; prefix?: string }): StorageProvider {
  const k = (key: string) => {
    assertSafeKey(key);
    return `${opts.prefix ?? ""}${key}`;
  };
  return {
    name: "blob",
    async put(key, body, { contentType }) {
      await put(k(key), Buffer.from(body), {
        access: "public",
        contentType,
        token: opts.token,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
    async get(key) {
      const info = await head(k(key), { token: opts.token }).catch(() => null);
      if (!info) return null;
      const res = await fetch(info.url);
      return res.ok ? { body: new Uint8Array(await res.arrayBuffer()), contentType: info.contentType } : null;
    },
    async head(key) {
      const info = await head(k(key), { token: opts.token }).catch(() => null);
      return info ? { bytes: info.size, contentType: info.contentType } : null;
    },
    async delete(key) {
      await del(k(key), { token: opts.token });
    },
    async list(prefix) {
      const r = await list({ prefix: k(prefix), token: opts.token });
      return r.blobs.map((b) => ({ key: b.pathname.slice((opts.prefix ?? "").length), bytes: b.size }));
    },
    async getSignedUrl(key) {
      const info = await head(k(key), { token: opts.token });
      return info.url;
    },
  };
}
