import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as mk from "../src/make";
import * as schema from "../src/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;

beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
});

const img = (n: number) => ({ storageKey: `make/${n}.webp`, mime: "image/webp", width: 800, height: 600, alt: "" });

const ids: string[] = [];
describe("showcase", () => {
  it("holds at most five published projects", async () => {
    for (let i = 1; i <= 5; i++)
      ids.push(
        (
          await mk.saveProject(db, {
            title: `Project ${i}`,
            stack: ["ts", "postgres"],
            published: true,
            status: i === 1 ? "building" : "shipped",
          })
        ).id,
      );
    await expect(mk.saveProject(db, { title: "Sixth", published: true })).rejects.toThrow(/at most 5/);
    const draft = await mk.saveProject(db, { title: "Sixth", published: false });
    expect(draft.published).toBe(false);
    await mk.saveProject(
      db,
      { title: "Project 1", published: true, status: "building", stack: ["ts", "postgres"] },
      ids[0],
    );
    await mk.deleteProject(db, draft.id);
  });
  it("addresses are unique and the workshop places follow the status", async () => {
    const a = await mk.saveProject(db, { title: "Project 1", published: false });
    expect(a.slug).toBe("project-1-2");
    await mk.deleteProject(db, a.id);
    expect(mk.placeOf("building")).toBe("bench");
    expect(mk.placeOf("shipped")).toBe("shelf");
    expect(mk.placeOf("archived")).toBe("scrap");
    expect(mk.PLACES.scrap.plain).toMatch(/learned/);
  });
  it("only links over https are accepted", async () => {
    await expect(
      mk.saveProject(db, { title: "L", links: [{ label: "x", url: "javascript:alert(1)", kind: "demo" }] }),
    ).rejects.toThrow();
    const ok = await mk.saveProject(db, {
      title: "Linked",
      links: [{ label: "Demo", url: "https://example.com/demo", kind: "demo" }],
    });
    expect(ok.links[0].url).toBe("https://example.com/demo");
    await mk.deleteProject(db, ok.id);
  });
  it("lists published projects in order and builds the tool wall", async () => {
    const list = await mk.listPublic(db);
    expect(list).toHaveLength(5);
    const wall = mk.toolWall(list);
    expect(wall[0]).toEqual({ tool: "postgres", count: 5 });
  });
});

describe("screenshots are only shown once checked", () => {
  it("a new image is hidden, then shown after review with a description", async () => {
    const p = (await mk.listPublic(db)).find((x) => x.id === ids[0]);
    if (!p) throw new Error("expected the first project");
    const i = await mk.addImage(db, p.id, img(1));
    expect(i.cover).toBe(true);
    expect((await mk.listPublic(db)).find((x) => x.id === p.id)?.cover).toBeNull();
    expect(await mk.publicImage(db, i.id)).toBeNull();
    await expect(mk.saveImage(db, i.id, { alt: "", reviewed: true })).rejects.toThrow(/Describe/);
    await mk.saveImage(db, i.id, { alt: "The dashboard with sample data", reviewed: true });
    expect((await mk.publicImage(db, i.id))?.id).toBe(i.id);
    expect((await mk.getPublicProject(db, p.slug))?.images).toHaveLength(1);
  });
  it("removing an image or unpublishing the project hides it again", async () => {
    const p = (await mk.listPublic(db)).find((x) => x.id === ids[0]);
    if (!p) throw new Error("expected the first project");
    const [first] = (await mk.getPublicProject(db, p.slug))?.images ?? [];
    await mk.removeImage(db, first.id);
    expect(await mk.publicImage(db, first.id)).toBeNull();
    const i2 = await mk.addImage(db, p.id, img(2));
    await mk.saveImage(db, i2.id, { alt: "A second screenshot", reviewed: true });
    await mk.saveProject(db, { title: p.title, published: false, status: p.status, stack: p.stack }, p.id);
    expect(await mk.publicImage(db, i2.id)).toBeNull();
    await mk.saveProject(db, { title: p.title, published: true, status: p.status, stack: p.stack }, p.id);
  });
  it("the cover can be chosen", async () => {
    const p = { id: ids[0] };
    await mk.addImage(db, p.id, img(3));
    const a = (await mk.getAdmin(db, p.id))?.images ?? [];
    const second = a.find((x) => !x.cover);
    if (!second) throw new Error("expected a second image");
    await mk.setCover(db, p.id, second.id);
    expect((await mk.getAdmin(db, p.id))?.images[0].id).toBe(second.id);
  });
});

describe("now log", () => {
  it("adds, lists newest first and removes", async () => {
    const a = await mk.addNow(db, "Reading about CRDTs");
    await mk.addNow(db, "Rebuilding the build pipeline");
    expect((await mk.listNow(db))[0].body).toMatch(/pipeline/);
    await expect(mk.addNow(db, "x")).rejects.toThrow();
    await mk.removeNow(db, a.id);
    expect(await mk.listNow(db)).toHaveLength(1);
  });
});
