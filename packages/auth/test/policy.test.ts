import { describe, expect, it } from "vitest";
import {
  actions,
  assertProductionSecret,
  can,
  checkGoogleProfile,
  isOpenSignIn,
  isStaff,
  normalizeEmail,
  safeCallback,
} from "../src/policy";

const D = "jerryqiu.com";
const ok = { email: "Jerry@JerryQiu.com", email_verified: true, hd: "jerryqiu.com" };

describe("checkGoogleProfile", () => {
  it("accepts a verified @jerryqiu.com account with the matching hd claim, normalising case", () => {
    expect(checkGoogleProfile(ok, D)).toEqual({ ok: true, email: "jerry@jerryqiu.com" });
  });
  it("rejects an unverified email", () => {
    expect(checkGoogleProfile({ ...ok, email_verified: false }, D)).toEqual({ ok: false, reason: "unverified" });
    expect(checkGoogleProfile({ ...ok, email_verified: "true" }, D)).toEqual({ ok: false, reason: "unverified" });
    expect(checkGoogleProfile({ ...ok, email_verified: undefined }, D)).toEqual({ ok: false, reason: "unverified" });
  });
  it("rejects other domains, even with a matching hd (consumer gmail has no hd)", () => {
    expect(checkGoogleProfile({ email: "someone@gmail.com", email_verified: true }, D)).toEqual({
      ok: false,
      reason: "wrong_domain",
    });
    expect(checkGoogleProfile({ email: "someone@gmail.com", email_verified: true, hd: "jerryqiu.com" }, D)).toEqual({
      ok: false,
      reason: "wrong_domain",
    });
  });
  it("requires the hd claim: a matching suffix alone is not enough", () => {
    expect(checkGoogleProfile({ email: "jerry@jerryqiu.com", email_verified: true }, D)).toEqual({
      ok: false,
      reason: "wrong_domain",
    });
    expect(checkGoogleProfile({ email: "jerry@jerryqiu.com", email_verified: true, hd: "other.org" }, D)).toEqual({
      ok: false,
      reason: "wrong_domain",
    });
  });
  it("is exact: lookalike and suffix tricks fail", () => {
    for (const email of [
      "a@jerryqiu.com.evil.com",
      "a@evil-jerryqiu.com",
      "a@sub.jerryqiu.com",
      "jerryqiu.com@evil.com",
      "a@jerryqiu.co",
    ])
      expect(checkGoogleProfile({ email, email_verified: true, hd: "jerryqiu.com" }, D).ok).toBe(false);
  });
  it("rejects missing or malformed email", () => {
    expect(checkGoogleProfile({}, D)).toEqual({ ok: false, reason: "no_email" });
    expect(checkGoogleProfile({ email: 42 }, D)).toEqual({ ok: false, reason: "no_email" });
    expect(checkGoogleProfile({ email: "noatsign", email_verified: true }, D)).toEqual({
      ok: false,
      reason: "no_email",
    });
  });
  it("tolerates a leading @ and uppercase in the configured domain", () => {
    expect(checkGoogleProfile(ok, "@JerryQiu.com").ok).toBe(true);
  });
});

describe("roles", () => {
  it("owner can do everything", () => {
    for (const a of actions) expect(can("owner", a)).toBe(true);
  });
  it("editor manages content but not users, settings or purging", () => {
    expect(can("editor", "content.write")).toBe(true);
    expect(can("editor", "media.write")).toBe(true);
    for (const a of [
      "users.manage",
      "settings.write",
      "trash.purge",
      "shootproof.manage",
      "studio.access",
      "inbox.delete",
    ] as const)
      expect(can("editor", a)).toBe(false);
  });
  it("client and unknown roles can do nothing in the admin", () => {
    for (const a of actions) {
      expect(can("client", a)).toBe(false);
      expect(can(undefined, a)).toBe(false);
    }
    expect(isStaff("client")).toBe(false);
    expect(isStaff("editor")).toBe(true);
  });
});

describe("safeCallback", () => {
  it("allows same-site relative paths only", () => {
    expect(safeCallback("/admin/posts")).toBe("/admin/posts");
    for (const bad of [
      "//evil.com",
      "https://evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "admin",
      "/ok\r\nSet-Cookie: x=1",
      null,
      undefined,
      "",
    ])
      expect(safeCallback(bad as string)).toBe("/admin");
  });
});

describe("safeCallback across our own sites", () => {
  const origins = ["https://photos.jerryqiu.com", "http://localhost:3002"];
  it("allows absolute URLs only for known origins", () => {
    expect(safeCallback("https://photos.jerryqiu.com/studio", "/admin", origins)).toBe(
      "https://photos.jerryqiu.com/studio",
    );
    expect(safeCallback("http://localhost:3002/studio", "/admin", origins)).toBe("http://localhost:3002/studio");
    for (const bad of [
      "https://photos.jerryqiu.com.evil.com/x",
      "https://evil.com/studio",
      "http://photos.jerryqiu.com/x",
      "javascript://photos.jerryqiu.com/%0Aalert(1)",
      "ftp://localhost:3002/x",
    ])
      expect(safeCallback(bad, "/admin", origins)).toBe("/admin");
  });
});

describe("environment guards", () => {
  it("open sign-in works only in development with the explicit flag", () => {
    expect(isOpenSignIn({ NODE_ENV: "development", DASHBOARD_OPEN_SIGNIN: "true" })).toBe(true);
    expect(isOpenSignIn({ NODE_ENV: "production", DASHBOARD_OPEN_SIGNIN: "true" })).toBe(false);
    expect(isOpenSignIn({ NODE_ENV: "development" })).toBe(false);
    expect(isOpenSignIn({ NODE_ENV: "test", DASHBOARD_OPEN_SIGNIN: "true" })).toBe(false);
  });
  it("production refuses a missing or placeholder AUTH_SECRET", () => {
    expect(() => assertProductionSecret({ NODE_ENV: "production" })).toThrow();
    expect(() =>
      assertProductionSecret({ NODE_ENV: "production", AUTH_SECRET: "dev-only-secret-never-use-in-production" }),
    ).toThrow();
    expect(() => assertProductionSecret({ NODE_ENV: "production", AUTH_SECRET: "short" })).toThrow();
    expect(() =>
      assertProductionSecret({ NODE_ENV: "production", AUTH_SECRET: "k3Jx9Qw2mZp8Rt5Yb7Nv4Ls6Df1Gh0AaBcDeF" }),
    ).not.toThrow();
    expect(() => assertProductionSecret({ NODE_ENV: "development" })).not.toThrow();
    expect(() =>
      assertProductionSecret({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" }),
    ).not.toThrow();
  });
  it("normalizeEmail trims and lowercases", () => {
    expect(normalizeEmail("  A@B.Co ")).toBe("a@b.co");
  });
});
