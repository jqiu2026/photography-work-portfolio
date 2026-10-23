import { can } from "@jerryqiu/auth";
import { describe, expect, it } from "vitest";
import { canSeeSection, groupsFor, studioSections } from "@/components/studio/sections";

describe("who sees which studio page", () => {
  const ids = studioSections.map((s) => s.id);
  it("the owner sees every page", () => {
    for (const id of ids) expect(canSeeSection("owner", id)).toBe(true);
  });
  it("a photographer sees shoots and galleries but no money, settings or team", () => {
    for (const id of ["galleries", "calendar", "shoots", "callsheets", "gear", "clients", "tasks", "visitors"])
      expect(canSeeSection("photographer", id)).toBe(true);
    for (const id of [
      "billing",
      "invoices",
      "orders",
      "quotes",
      "expenses",
      "reports",
      "users",
      "plan",
      "brand",
      "forms",
      "automations",
      "subscribers",
      "testimonials",
      "rights",
      "packages",
    ])
      expect(canSeeSection("photographer", id)).toBe(false);
  });
  it("a bookkeeper sees the money side but no galleries or settings", () => {
    for (const id of ["orders", "quotes", "invoices", "billing", "expenses", "reports", "clients"])
      expect(canSeeSection("bookkeeper", id)).toBe(true);
    for (const id of ["galleries", "visitors", "calendar", "gear", "users", "plan", "brand", "forms", "subscribers"])
      expect(canSeeSection("bookkeeper", id)).toBe(false);
  });
  it("clients, editors and signed-out visitors see none", () => {
    for (const role of ["client", "editor", undefined])
      for (const id of ids) expect(canSeeSection(role, id)).toBe(false);
  });
  it("the sidebar drops groups a role cannot open", () => {
    expect(groupsFor("bookkeeper").map((g) => g.id)).not.toContain("galleries");
    expect(groupsFor("photographer").map((g) => g.id)).not.toContain("store");
    expect(groupsFor("photographer").map((g) => g.id)).toContain("galleries");
    expect(groupsFor("owner").length).toBeGreaterThanOrEqual(7);
  });
});

describe("what each role may do", () => {
  it("helpers can open the studio; only the bookkeeper (and owner) touch money; only the owner changes settings", () => {
    expect(can("photographer", "studio.access")).toBe(true);
    expect(can("photographer", "studio.money")).toBe(false);
    expect(can("photographer", "settings.write")).toBe(false);
    expect(can("photographer", "users.manage")).toBe(false);
    expect(can("bookkeeper", "studio.access")).toBe(true);
    expect(can("bookkeeper", "studio.money")).toBe(true);
    expect(can("bookkeeper", "settings.write")).toBe(false);
    expect(can("bookkeeper", "users.manage")).toBe(false);
    expect(can("owner", "studio.money")).toBe(true);
    expect(can("client", "studio.access")).toBe(false);
  });
});
