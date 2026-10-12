import { AwsClient } from "aws4fetch";
import { type StorageProvider, assertSafeKey } from "./types";

/** Cloudflare R2 over its S3-compatible API (no SDK; aws4fetch signs requests). Zero egress fees. */
export function r2Provider(opts: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}): StorageProvider {
  const aws = new AwsClient({
    accessKeyId: opts.accessKeyId,
    secretAccessKey: opts.secretAccessKey,
    service: "s3",
    region: "auto",
  });
  const base = `https://${opts.accountId}.r2.cloudflarestorage.com/${opts.bucket}`;
  const url = (key: string) => {
    assertSafeKey(key);
    return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
  };
  return {
    name: "r2",
    async put(key, body, { contentType }) {
      const res = await aws.fetch(url(key), {
        method: "PUT",
        body: body as BodyInit,
        headers: { "Content-Type": contentType },
      });
      if (!res.ok) throw new Error(`R2 put failed: ${res.status}`);
    },
    async get(key) {
      const res = await aws.fetch(url(key));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`R2 get failed: ${res.status}`);
      return {
        body: new Uint8Array(await res.arrayBuffer()),
        contentType: res.headers.get("content-type") ?? "application/octet-stream",
      };
    },
    async head(key) {
      const res = await aws.fetch(url(key), { method: "HEAD" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`R2 head failed: ${res.status}`);
      return {
        bytes: Number(res.headers.get("content-length") ?? 0),
        contentType: res.headers.get("content-type") ?? "application/octet-stream",
      };
    },
    async delete(key) {
      const res = await aws.fetch(url(key), { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed: ${res.status}`);
    },
    async list(prefix) {
      const res = await aws.fetch(`${base}?list-type=2&prefix=${encodeURIComponent(prefix)}`);
      if (!res.ok) throw new Error(`R2 list failed: ${res.status}`);
      const xml = await res.text();
      return [...xml.matchAll(/<Contents>.*?<Key>(.*?)<\/Key>.*?<Size>(\d+)<\/Size>.*?<\/Contents>/gs)].map((m) => ({
        key: m[1],
        bytes: Number(m[2]),
      }));
    },
    async getSignedUrl(key, { expiresIn, method, contentType }) {
      const u = new URL(url(key));
      u.searchParams.set("X-Amz-Expires", String(expiresIn));
      const signed = await aws.sign(
        new Request(u, { method, headers: contentType ? { "Content-Type": contentType } : {} }),
        { aws: { signQuery: true } },
      );
      return signed.url;
    },
  };
}
