import { describe, expect, it } from "vitest";
import {
  ALLOWED_WIDTHS,
  TTL,
  clientIpHash,
  decrypt,
  encrypt,
  imageUrl,
  signImageToken,
  tokenSecrets,
  verifyImageToken,
} from "../src";

const S = ["secret-one"];
const now = 1_800_000_000_000;
const mint = (over: Partial<Parameters<typeof signImageToken>[0]> = {}) =>
  signImageToken({ id: "img1", width: 960, ttl: 300, secrets: S, now, ...over });

describe("image tokens", () => {
  it("verifies a fresh token and returns its payload", () => {
    const r = verifyImageToken(mint(), S, { id: "img1", width: 960, now });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload).toMatchObject({ i: "img1", w: 960 });
  });
  it("missing or malformed tokens fail", () => {
    expect(verifyImageToken(undefined, S).ok).toBe(false);
    expect(verifyImageToken("", S)).toEqual({ ok: false, reason: "malformed" });
    expect(verifyImageToken("a.b.c", S)).toEqual({ ok: false, reason: "malformed" });
    expect(verifyImageToken("x".repeat(700), S)).toEqual({ ok: false, reason: "malformed" });
  });
  it("a forged signature fails; a tampered payload fails", () => {
    const [body] = mint().split(".");
    expect(verifyImageToken(`${body}.AAAA`, S, { now })).toEqual({ ok: false, reason: "bad_signature" });
    const forged = Buffer.from(JSON.stringify({ i: "other", w: 2400, v: "", e: now / 1000 + 9999 })).toString(
      "base64url",
    );
    expect(verifyImageToken(`${forged}.${mint().split(".")[1]}`, S, { now }).ok).toBe(false);
  });
  it("an expired token fails: replay after expiry is refused", () => {
    const t = mint({ ttl: 300 });
    expect(verifyImageToken(t, S, { now: now + 299_000 }).ok).toBe(true);
    expect(verifyImageToken(t, S, { now: now + 301_000 })).toEqual({ ok: false, reason: "expired" });
  });
  it("a token for another image or width is refused", () => {
    const t = mint();
    expect(verifyImageToken(t, S, { id: "img2", now })).toEqual({ ok: false, reason: "wrong_image" });
    expect(verifyImageToken(t, S, { width: 2400, now })).toEqual({ ok: false, reason: "wrong_width" });
  });
  it("binds to a viewer when one was set", () => {
    const t = mint({ viewer: "v1" });
    expect(verifyImageToken(t, S, { viewer: "v1", now }).ok).toBe(true);
    expect(verifyImageToken(t, S, { viewer: "v2", now })).toEqual({ ok: false, reason: "wrong_viewer" });
  });
  it("ttl is capped at the public maximum", () => {
    const t = mint({ ttl: 10 * 24 * 3600 });
    expect(verifyImageToken(t, S, { now: now + (TTL.public + 5) * 1000 })).toEqual({ ok: false, reason: "expired" });
  });
  it("only allowed widths can be signed", () => {
    expect(() => mint({ width: 5000 })).toThrow();
    for (const w of ALLOWED_WIDTHS) expect(() => mint({ width: w })).not.toThrow();
  });
  it("supports key rotation: old tokens verify while the new key signs", () => {
    const old = signImageToken({ id: "i", width: 480, ttl: 300, secrets: ["old"], now });
    expect(verifyImageToken(old, ["new", "old"], { now }).ok).toBe(true);
    expect(verifyImageToken(old, ["new"], { now }).ok).toBe(false);
    const fresh = signImageToken({ id: "i", width: 480, ttl: 300, secrets: ["new", "old"], now });
    expect(verifyImageToken(fresh, ["new"], { now }).ok).toBe(true);
  });
  it("imageUrl is an opaque route with no file name", () => {
    const u = imageUrl({ id: "abc", width: 960, secrets: S, now });
    expect(u).toMatch(/^\/api\/img\/abc\?w=960&t=[\w-]+\.[\w-]+$/);
    expect(u).not.toMatch(/\.(jpg|png|webp|avif)/);
  });
  it("tokenSecrets reads env with a fallback and rotation slot", () => {
    expect(tokenSecrets({ AUTH_SECRET: "a" })).toEqual(["a"]);
    expect(tokenSecrets({ IMAGE_TOKEN_SECRET: "i", IMAGE_TOKEN_SECRET_PREVIOUS: "p", AUTH_SECRET: "a" })).toEqual([
      "i",
      "p",
    ]);
    expect(tokenSecrets({})).toEqual([]);
  });
});

describe("crypto", () => {
  it("round-trips, and a changed secret or tampering yields undefined", () => {
    const c = encrypt("refresh-token", "k1");
    expect(c).not.toContain("refresh-token");
    expect(decrypt(c, "k1")).toBe("refresh-token");
    expect(decrypt(c, "k2")).toBeUndefined();
    expect(decrypt(`${c}x`, "k1")).toBeUndefined();
    expect(decrypt("garbage", "k1")).toBeUndefined();
  });
  it("uses a fresh IV every time", () => {
    expect(encrypt("same", "k")).not.toBe(encrypt("same", "k"));
  });
});

describe("clientIpHash", () => {
  it("is stable per ip, differs between ips and hides the raw ip", () => {
    const h = (ip: string) => ({ get: (n: string) => (n === "x-forwarded-for" ? ip : null) });
    expect(clientIpHash(h("1.2.3.4"), "s")).toBe(clientIpHash(h("1.2.3.4, 9.9.9.9"), "s"));
    expect(clientIpHash(h("1.2.3.4"), "s")).not.toBe(clientIpHash(h("1.2.3.5"), "s"));
    expect(clientIpHash(h("1.2.3.4"), "s")).not.toContain("1.2.3.4");
  });
});
