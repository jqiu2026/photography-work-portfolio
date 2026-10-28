import { readdirSync } from "node:fs";
import * as hm from "@holominimal/ui";
import { describe, expect, it } from "vitest";
import { docs } from "../src/content/components";

/** Every documented component is a real export of @holominimal/ui, documented once, with the notes filled in. */
describe("docs coverage", () => {
  it("documents only real Holominimal exports, each once", () => {
    const names = new Set(Object.keys(hm));
    expect(docs.map((d) => d.name).filter((n) => !names.has(n))).toEqual([]);
    expect(new Set(docs.map((d) => d.name)).size).toBe(docs.length);
  });
  it("every entry has accessibility notes, a when-not-to-use note and code", () => {
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
    for (const r of ["getting-started", "theming", "motion", "accessibility", "changelog", "contributing", "components"])
      expect(routes).toContain(r);
  });
});
