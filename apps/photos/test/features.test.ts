import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { counts, features } from "../src/content/features";

/** The marketing pages read `content/features.ts`. It must agree with the spec's feature table, row for row. */
const spec = readFileSync(path.resolve(__dirname, "../../../docs/project/01-photo-site-spec.md"), "utf8");
const table = spec.slice(spec.indexOf("## 6. Feature table"), spec.indexOf("## 7. Marketing"));
const rows = [...table.matchAll(/^\| (F-\d+) \| (.*?) \| (?:P1\/P2|P1\/P3|P2\/P3|P1|P2|P3|OPT) \| (.*?) \|/gm)].map(
  (m) => ({ id: m[1], status: m[3] }),
);
const map = (s: string) =>
  s.startsWith("done") ? "live" : s.startsWith("partial") || s.startsWith("mock") ? "preview" : "soon";

describe("features.ts mirrors the spec table", () => {
  it("has every feature id, once", () => {
    expect(rows.length).toBeGreaterThan(80);
    expect(features.map((f) => f.id).sort()).toEqual(rows.map((r) => r.id).sort());
    expect(new Set(features.map((f) => f.id)).size).toBe(features.length);
  });
  it("agrees on every status (done is Live, partial or mock is Preview, missing is Soon)", () => {
    const bad = rows
      .filter((r) => features.find((f) => f.id === r.id)?.status !== map(r.status))
      .map((r) => `${r.id}: spec says "${r.status}"`);
    expect(bad).toEqual([]);
  });
  it("counts add up", () => {
    const c = counts();
    expect(c.live + c.preview + c.soon).toBe(features.length);
    expect(c.live).toBeGreaterThan(30);
  });
});
