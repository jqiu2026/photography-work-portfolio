import { readdirSync } from "node:fs";
import * as main from "@halation/ui";
import * as media from "@halation/ui/media";
import * as motion from "@halation/ui/motion";
import * as webgl from "@halation/ui/webgl";
import { describe, expect, it } from "vitest";
import { docs } from "../src/content/components";

/** Every exported component of @halation/ui must have a docs entry, and every entry a real export. */
const exportsOf = (m: object) => Object.keys(m).filter((k) => /^[A-Z]/.test(k));

describe("docs coverage", () => {
  it("documents every exported component, and only real ones", () => {
    const all = [...exportsOf(main), ...exportsOf(motion), ...exportsOf(media), ...exportsOf(webgl)];
    const documented = docs.map((d) => d.name);
    expect(all.filter((n) => !documented.includes(n))).toEqual([]);
    expect(documented.filter((n) => !all.includes(n))).toEqual([]);
    expect(new Set(documented).size).toBe(documented.length);
  });
  it("every entry has accessibility notes and a when-not-to-use note", () => {
    for (const d of docs) {
      expect(d.a11y.length, d.name).toBeGreaterThan(2);
      expect(d.whenNot.length, d.name).toBeGreaterThan(2);
      expect(d.code.length, d.name).toBeGreaterThan(2);
    }
  });
  it("live demos exist for entries marked live", async () => {
    const { hasDemo } = await import("../src/components/Demos");
    expect(docs.filter((d) => d.live && !hasDemo(d.name)).map((d) => d.name)).toEqual([]);
  });
  it("has a page for each docs route", () => {
    const routes = readdirSync("src/app");
    for (const r of ["getting-started", "theming", "motion", "accessibility", "changelog", "contributing", "components"]) expect(routes).toContain(r);
  });
});
