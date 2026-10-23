import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { type Database, schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import { authorizeSignIn, findUser } from "../src/users";

let db: Database;
const migrations = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../db/drizzle");
const good = (email: string, extra = {}) => ({
  email,
  email_verified: true,
  hd: "jerryqiu.com",
  name: "Name",
  picture: "https://x/y.png",
  ...extra,
});
const opts = { domain: "jerryqiu.com", bootstrapEmails: ["owner@jerryqiu.com"] };

beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: migrations });
  db = d as unknown as Database;
});

describe("authorizeSignIn (domain policy + allow-list)", () => {
  it("denies a valid-domain account that is not on the allow-list", async () => {
    expect(await authorizeSignIn(db, good("stranger@jerryqiu.com"), opts)).toEqual({ ok: false, reason: "not_listed" });
  });
  it("denies other domains before touching the database", async () => {
    expect(await authorizeSignIn(db, { email: "x@gmail.com", email_verified: true }, opts)).toEqual({
      ok: false,
      reason: "wrong_domain",
    });
    expect(await db.select().from(schema.users)).toHaveLength(0);
  });
  it("bootstraps ADMIN_EMAILS as owner on first sign-in, case-insensitively", async () => {
    const r = await authorizeSignIn(db, good("Owner@JerryQiu.com"), opts);
    expect(r.ok && r.user.role).toBe("owner");
    expect((await findUser(db, "OWNER@jerryqiu.com"))?.role).toBe("owner");
  });
  it("lets an invited editor in and records the sign-in", async () => {
    await db
      .insert(schema.users)
      .values({ email: "editor@jerryqiu.com", role: "editor", addedBy: "owner@jerryqiu.com" });
    const r = await authorizeSignIn(db, good("editor@jerryqiu.com"), opts);
    expect(r.ok && r.user.role).toBe("editor");
    const [row] = await db.select().from(schema.users).where(eq(schema.users.email, "editor@jerryqiu.com"));
    expect(row.lastSignInAt).toBeInstanceOf(Date);
    expect(row.name).toBe("Name");
  });
  it("a removed or deactivated user loses access on the very next lookup", async () => {
    expect(await findUser(db, "editor@jerryqiu.com")).toBeDefined();
    await db.update(schema.users).set({ active: false }).where(eq(schema.users.email, "editor@jerryqiu.com"));
    expect(await findUser(db, "editor@jerryqiu.com")).toBeUndefined();
    expect(await authorizeSignIn(db, good("editor@jerryqiu.com"), opts)).toEqual({ ok: false, reason: "inactive" });
    await db.delete(schema.users).where(eq(schema.users.email, "editor@jerryqiu.com"));
    expect(await authorizeSignIn(db, good("editor@jerryqiu.com"), opts)).toEqual({ ok: false, reason: "not_listed" });
  });
  it("an unverified or hd-less Google identity is denied even if allow-listed", async () => {
    expect(await authorizeSignIn(db, good("owner@jerryqiu.com", { email_verified: false }), opts)).toEqual({
      ok: false,
      reason: "unverified",
    });
    expect(await authorizeSignIn(db, good("owner@jerryqiu.com", { hd: undefined }), opts)).toEqual({
      ok: false,
      reason: "wrong_domain",
    });
  });
  it("a client-role user can sign in to the allow-list but has no admin actions (see policy tests)", async () => {
    await db.insert(schema.users).values({ email: "client@jerryqiu.com", role: "client" });
    const r = await authorizeSignIn(db, good("client@jerryqiu.com"), opts);
    expect(r.ok && r.user.role).toBe("client");
  });
});

describe("invited team members may use any verified Google account", () => {
  const gmail = (email: string, extra = {}) => ({ email, email_verified: true, name: "Helper", ...extra });
  it("an invited external photographer signs in from a personal Gmail", async () => {
    await db
      .insert(schema.users)
      .values({ email: "helper@gmail.com", role: "photographer", external: true, addedBy: "owner@jerryqiu.com" });
    const r = await authorizeSignIn(db, gmail("Helper@Gmail.com"), opts);
    expect(r.ok && r.user.role).toBe("photographer");
  });
  it("an unverified address, a stranger, an inactive helper and a non-external user are all refused", async () => {
    expect(await authorizeSignIn(db, gmail("helper@gmail.com", { email_verified: false }), opts)).toEqual({
      ok: false,
      reason: "unverified",
    });
    expect(await authorizeSignIn(db, gmail("stranger@gmail.com"), opts)).toEqual({ ok: false, reason: "wrong_domain" });
    await db.insert(schema.users).values({ email: "internal@gmail.com", role: "bookkeeper", external: false });
    expect(await authorizeSignIn(db, gmail("internal@gmail.com"), opts)).toEqual({ ok: false, reason: "wrong_domain" });
    await db.update(schema.users).set({ active: false }).where(eq(schema.users.email, "helper@gmail.com"));
    expect(await authorizeSignIn(db, gmail("helper@gmail.com"), opts)).toEqual({ ok: false, reason: "wrong_domain" });
  });
});
