import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertSafeKey, createStorage, localStorageProvider, signLocal, verifyLocal } from "../src";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "jq-storage-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});
const make = (store = "originals") =>
  localStorageProvider({ dir, secret: "s3cret", baseUrl: "http://localhost:3000", store });

describe("local storage", () => {
  it("puts, gets, heads, lists and deletes", async () => {
    const s = make();
    await s.put("a/b/one.webp", new Uint8Array([1, 2, 3]), { contentType: "image/webp" });
    await s.put("a/two.png", new Uint8Array([9]), { contentType: "image/png" });
    expect((await s.get("a/b/one.webp"))?.body).toEqual(new Uint8Array([1, 2, 3]));
    expect((await s.get("a/b/one.webp"))?.contentType).toBe("image/webp");
    expect(await s.head("a/two.png")).toEqual({ bytes: 1, contentType: "image/png" });
    expect((await s.list("a")).map((x) => x.key).sort()).toEqual(["a/b/one.webp", "a/two.png"]);
    await s.delete("a/two.png");
    expect(await s.get("a/two.png")).toBeNull();
    expect(await s.head("nope.png")).toBeNull();
  });
  it("keeps the two stores separate", async () => {
    await make("originals").put("x.png", new Uint8Array([1]), { contentType: "image/png" });
    expect(await make("public").get("x.png")).toBeNull();
  });
  it("rejects keys that could escape the root", () => {
    for (const bad of ["../etc/passwd", "/abs", "a/../../b", "a\\b", "", "a b", "x".repeat(400)])
      expect(() => assertSafeKey(bad)).toThrow();
    expect(() => assertSafeKey("images/2026/abc-123_x.webp")).not.toThrow();
  });
  it("signed URLs verify, expire, and are bound to key and method", async () => {
    const s = make();
    const url = new URL(await s.getSignedUrl("a.png", { expiresIn: 60, method: "GET" }));
    const exp = Number(url.searchParams.get("exp"));
    const sig = url.searchParams.get("sig") ?? "";
    expect(verifyLocal("s3cret", "GET", "originals/a.png", exp, sig)).toBe(true);
    expect(verifyLocal("s3cret", "PUT", "originals/a.png", exp, sig)).toBe(false);
    expect(verifyLocal("s3cret", "GET", "originals/b.png", exp, sig)).toBe(false);
    expect(verifyLocal("wrong", "GET", "originals/a.png", exp, sig)).toBe(false);
    expect(verifyLocal("s3cret", "GET", "originals/a.png", exp, sig, (exp + 1) * 1000)).toBe(false);
    expect(signLocal("s3cret", "GET", "k", 1)).toBe(signLocal("s3cret", "GET", "k", 1));
  });
});

describe("factory", () => {
  it("defaults to local and never uses Blob for originals", () => {
    expect(createStorage("originals", {}).name).toBe("local");
    expect(() => createStorage("originals", { STORAGE_DRIVER: "blob", BLOB_READ_WRITE_TOKEN: "t" })).toThrow(
      /private originals/,
    );
  });
  it("falls back to local (with a warning) when credentials are missing", () => {
    expect(createStorage("public", { STORAGE_DRIVER: "r2" }).name).toBe("local");
    expect(createStorage("public", { STORAGE_DRIVER: "blob" }).name).toBe("local");
  });
  it("uses R2 and Blob when configured", () => {
    const r2 = {
      STORAGE_DRIVER: "r2",
      R2_ACCOUNT_ID: "a",
      R2_ACCESS_KEY_ID: "k",
      R2_SECRET_ACCESS_KEY: "s",
      R2_BUCKET_ORIGINALS: "o",
      R2_BUCKET_PUBLIC: "p",
    };
    expect(createStorage("originals", r2).name).toBe("r2");
    expect(createStorage("public", { STORAGE_DRIVER: "blob", BLOB_READ_WRITE_TOKEN: "t" }).name).toBe("blob");
  });
});
