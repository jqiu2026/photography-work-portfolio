import { describe, expect, it } from "vitest";
import { validateRedirect } from "../src/lib/redirects";
import { navToLines, parseNavLines, readSetting, settingSchemas } from "@jerryqiu/db/settings";

describe("validateRedirect", () => {
  it("accepts a path to a path or an https URL and trims trailing slashes", () => {
    expect(validateRedirect("/old/", "/new")).toEqual({ ok: true, from: "/old", to: "/new" });
    expect(validateRedirect("/old", "https://example.com/x")).toMatchObject({ ok: true });
  });
  it("refuses open-redirect and scheme tricks", () => {
    for (const to of ["//evil.com", "javascript:alert(1)", "http://insecure.com", "/a b", "/a\\b", "https://"])
      expect(validateRedirect("/old", to)).toMatchObject({ ok: false, field: "toPath" });
  });
  it("refuses protected or malformed sources and self-redirects", () => {
    for (const from of ["/", "/admin/x", "/api/x", "//x", "old", "/a b"])
      expect(validateRedirect(from, "/new")).toMatchObject({ ok: false, field: "fromPath" });
    expect(validateRedirect("/same", "/same/")).toMatchObject({ ok: false, field: "toPath" });
  });
});

describe("settings", () => {
  it("falls back to defaults field by field for missing or malformed stored data", () => {
    expect(readSetting("theme", undefined)).toEqual({ accent: "default" });
    expect(readSetting("theme", { accent: "purple" })).toEqual({ accent: "default" });
    expect(readSetting("general", { siteName: "Jerry" }).siteName).toBe("Jerry");
    expect(readSetting("protection", "garbage").level).toBe("light");
  });
  it("round-trips navigation lines and rejects unsafe targets", () => {
    const items = parseNavLines("About | /about\n\n Work | /work ");
    expect(items).toEqual([
      { label: "About", href: "/about" },
      { label: "Work", href: "/work" },
    ]);
    expect(navToLines(items)).toBe("About | /about\nWork | /work");
    expect(settingSchemas.nav.safeParse({ items: [{ label: "x", href: "javascript:alert(1)" }] }).success).toBe(false);
    expect(settingSchemas.nav.safeParse({ items: [{ label: "x", href: "//evil.com" }] }).success).toBe(false);
  });
  it("bounds watermark opacity", () => {
    expect(settingSchemas.protection.safeParse({ ...readSetting("protection", {}), watermarkOpacity: 5 }).success).toBe(
      false,
    );
  });
});

import { wouldLeaveNoOwner } from "../src/lib/user-rules";

describe("last owner rule", () => {
  it("blocks removing the only active owner but allows it when another remains", () => {
    expect(wouldLeaveNoOwner(["a@jerryqiu.com"], "a@jerryqiu.com")).toBe(true);
    expect(wouldLeaveNoOwner(["a@jerryqiu.com", "b@jerryqiu.com"], "a@jerryqiu.com")).toBe(false);
    expect(wouldLeaveNoOwner([], "a@jerryqiu.com")).toBe(true);
  });
});
