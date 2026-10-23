import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as schema from "../src/schema";
import * as team from "../src/team";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  await db.insert(schema.users).values({ email: "owner@jerryqiu.com", role: "owner" });
});

describe("the team", () => {
  it("invites a helper by Google address with a role, as an external sign-in", async () => {
    const id = await team.inviteMember(
      db,
      { email: "  Helper@Gmail.com ", name: "Helper", role: "photographer" },
      "owner@jerryqiu.com",
    );
    const t = await team.listTeam(db);
    const row = t.find((x) => x.id === id);
    expect(row).toMatchObject({ email: "helper@gmail.com", role: "photographer", active: true, external: true });
  });
  it("refuses throwaway addresses, bad roles, and people who already have full access", async () => {
    await expect(team.inviteMember(db, { email: "x@mailinator.com", role: "photographer" }, "o")).rejects.toThrow(
      "temporary",
    );
    await expect(team.inviteMember(db, { email: "ok@gmail.com", role: "owner" }, "o")).rejects.toThrow(
      "bookkeeper or photographer",
    );
    await expect(team.inviteMember(db, { email: "owner@jerryqiu.com", role: "bookkeeper" }, "o")).rejects.toThrow(
      "full access",
    );
  });
  it("changes a role and switches a person off; owners cannot be touched here", async () => {
    const id = await team.inviteMember(db, { email: "money@gmail.com", role: "photographer" }, "o");
    await team.changeMemberRole(db, id, "bookkeeper");
    await team.setMemberActive(db, id, false);
    expect((await team.listTeam(db)).find((x) => x.id === id)).toMatchObject({ role: "bookkeeper", active: false });
    const [owner] = (await team.listTeam(db)).filter((x) => x.role === "owner");
    await expect(team.setMemberActive(db, (owner as { id: string }).id, false)).rejects.toThrow("Owners");
  });
});

describe("taking back what you just added", () => {
  const photographer = { role: "photographer", email: "helper@gmail.com" };
  it("the owner may remove anything", async () => {
    expect(await team.canRemove(db, { role: "owner", email: "owner@jerryqiu.com" }, "gallery", "g-1")).toBe(true);
  });
  it("a photographer may remove only their own addition, only inside five minutes", async () => {
    const now = new Date("2027-01-01T12:00:00Z");
    // nothing recorded: no
    expect(await team.canRemove(db, photographer, "gallery", "g-2", now)).toBe(false);
    await team.markCreated(db, "helper@gmail.com", "gallery", "g-2");
    // recorded just now (the real clock): the check at a time 3 minutes later is false only if the row is old; use real time
    expect(await team.canRemove(db, photographer, "gallery", "g-2")).toBe(true);
    // someone else's addition: no
    expect(await team.canRemove(db, { role: "photographer", email: "other@gmail.com" }, "gallery", "g-2")).toBe(false);
    // six minutes on: no
    expect(await team.canRemove(db, photographer, "gallery", "g-2", new Date(Date.now() + 6 * 60_000))).toBe(false);
    // four minutes on: still yes
    expect(await team.canRemove(db, photographer, "gallery", "g-2", new Date(Date.now() + 4 * 60_000))).toBe(true);
    // a different kind of thing with the same id: no
    expect(await team.canRemove(db, photographer, "album", "g-2")).toBe(false);
  });
  it("marking twice keeps the first time", async () => {
    await team.markCreated(db, "helper@gmail.com", "task", "t-1");
    await team.markCreated(db, "someone-else@gmail.com", "task", "t-1");
    expect(await team.canRemove(db, photographer, "task", "t-1")).toBe(true);
    expect(await team.canRemove(db, { role: "photographer", email: "someone-else@gmail.com" }, "task", "t-1")).toBe(
      false,
    );
  });
});
