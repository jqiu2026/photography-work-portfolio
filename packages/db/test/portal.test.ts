import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as portal from "../src/portal";
import * as schema from "../src/schema";
import * as st from "../src/studio";
import { isIdRef, passwordProblem } from "../src/studio-crypto";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let clientId: string;
let jobId: string;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  const c = await st.createClient(db, { name: "Portal Person", email: "Portal@Example.com" });
  clientId = c.id;
  jobId = (await st.createJob(db, { clientId, title: "Portal job", feeCents: 30000 })).id;
});

describe("passwords", () => {
  it("rejects short, common, repeated and email-derived passwords", () => {
    expect(passwordProblem("short")).toMatch(/10/);
    expect(passwordProblem("password1")).toBeTruthy();
    expect(passwordProblem("Password1")).toBeTruthy();
    expect(passwordProblem("aaaaaaaaaaaa")).toMatch(/repeated/);
    expect(passwordProblem("portalperson-2027", "portalperson@example.com")).toMatch(/email/);
    expect(passwordProblem("correct horse battery staple")).toBeNull();
  });
});

describe("magic links and sign-in", () => {
  it("a client with no account gets one on request; unknown emails get nothing; tokens are single use and expire", async () => {
    expect(await portal.requestMagicLink(db, "nobody@example.com")).toBeNull();
    expect(await portal.requestMagicLink(db, "not-an-email")).toBeNull();
    const now = new Date("2027-01-01T12:00:00Z");
    const r = await portal.requestMagicLink(db, " PORTAL@example.com ", now);
    expect(r?.account.clientId).toBe(clientId);
    const token = r?.token as string;
    expect(await portal.peekToken(db, token, ["magic"], now)).toBe(true);
    expect(await portal.consumeToken(db, token, ["reset"], now)).toBeNull(); // wrong kind
    const used = await portal.consumeToken(db, token, ["magic"], now);
    expect(used?.account.email).toBe("portal@example.com");
    expect(await portal.consumeToken(db, token, ["magic"], now)).toBeNull();
    const late = (await portal.requestMagicLink(db, "portal@example.com", now))?.token as string;
    expect(await portal.consumeToken(db, late, ["magic"], new Date(now.getTime() + 16 * 60_000))).toBeNull();
    expect(await portal.consumeToken(db, "garbage", ["magic"], now)).toBeNull();
  });

  it("two people using the same link at once: one wins", async () => {
    const token = (await portal.requestMagicLink(db, "portal@example.com"))?.token as string;
    const rs = await Promise.all([1, 2, 3].map(() => portal.consumeToken(db, token, ["magic"])));
    expect(rs.filter(Boolean)).toHaveLength(1);
  });
});

describe("password login", () => {
  it("sets a password (policy enforced), signs in, is vague about failures, and locks after repeated wrong tries", async () => {
    const acct = await portal.ensureAccount(db, clientId);
    await expect(portal.setPassword(db, acct.id, "short")).rejects.toThrow(/10/);
    await portal.setPassword(db, acct.id, "a long and unusual passphrase");
    const now = new Date("2027-02-01T10:00:00Z");
    const ok = await portal.loginWithPassword(db, "portal@example.com", "a long and unusual passphrase", now);
    expect(ok.ok).toBe(true);
    const bad = await portal.loginWithPassword(db, "portal@example.com", "wrong wrong wrong", now);
    const nobody = await portal.loginWithPassword(db, "nobody@example.com", "wrong wrong wrong", now);
    expect(bad).toEqual(nobody); // identical message: no account enumeration
    for (let i = 0; i < 8; i++) await portal.loginWithPassword(db, "portal@example.com", `nope nope ${i}`, now);
    const locked = await portal.loginWithPassword(db, "portal@example.com", "a long and unusual passphrase", now);
    expect(locked).toMatchObject({ ok: false });
    expect((locked as { error: string }).error).toMatch(/Too many/);
    const later = await portal.loginWithPassword(
      db,
      "portal@example.com",
      "a long and unusual passphrase",
      new Date(now.getTime() + 16 * 60_000),
    );
    expect(later.ok).toBe(true);
  });

  it("an account with no password cannot sign in with an empty or guessed one; change needs the current password", async () => {
    const c2 = await st.createClient(db, { name: "No Password", email: "nopass@example.com" });
    const a2 = await portal.ensureAccount(db, c2.id);
    expect((await portal.loginWithPassword(db, "nopass@example.com", "")).ok).toBe(false);
    expect((await portal.loginWithPassword(db, "nopass@example.com", "anything at all")).ok).toBe(false);
    await portal.setPassword(db, a2.id, "first long passphrase here");
    await expect(portal.changePassword(db, a2.id, "wrong current one", "second long passphrase here")).rejects.toThrow(
      /current password/,
    );
    await portal.changePassword(db, a2.id, "first long passphrase here", "second long passphrase here");
    expect((await portal.loginWithPassword(db, "nopass@example.com", "second long passphrase here")).ok).toBe(true);
  });

  it("invite and reset tokens work as sign-in tokens of their own kind", async () => {
    const inv = await portal.inviteClient(db, clientId);
    expect((await portal.consumeToken(db, inv.token, ["invite", "reset"]))?.kind).toBe("invite");
    const rs = await portal.requestPasswordReset(db, "portal@example.com");
    expect(await portal.peekToken(db, rs?.token as string, ["reset"])).toBe(true);
    expect(await portal.requestPasswordReset(db, "nobody@example.com")).toBeNull();
  });
});

describe("messages and overview", () => {
  it("stores messages in both directions, marks them read, and rejects empty or huge ones", async () => {
    await portal.postMessage(db, { clientId, direction: "in", body: "When will my photos be ready?" });
    await portal.postMessage(db, { clientId, jobId, direction: "out", body: "By Friday." });
    await expect(portal.postMessage(db, { clientId, direction: "in", body: " " })).rejects.toThrow();
    await expect(portal.postMessage(db, { clientId, direction: "in", body: "x".repeat(4001) })).rejects.toThrow(
      /too long/,
    );
    expect((await portal.listMessages(db, clientId)).map((m) => m.direction)).toEqual(["in", "out"]);
    await portal.markRead(db, clientId, "out");
    expect((await portal.listMessages(db, clientId)).find((m) => m.direction === "out")?.readAt).toBeTruthy();
    expect((await portal.recentThreads(db))[0].client.id).toBe(clientId);
  });

  it("the overview returns only this client's documents", async () => {
    const other = await st.createClient(db, { name: "Other", email: "other@example.com" });
    const oj = await st.createJob(db, { clientId: other.id, title: "Other job" });
    await st.createContract(db, { jobId, title: "Mine", body: "text" });
    await st.createContract(db, { jobId: oj.id, title: "Theirs", body: "text" });
    const o = await portal.clientOverview(db, clientId);
    expect(o.jobs.map((j) => j.title)).toEqual(["Portal job"]);
    expect(o.contracts.map((c) => c.title)).toEqual(["Mine"]);
  });
});

describe("id references", () => {
  it("only well-formed id: references are recognized, and they resolve documents by id", async () => {
    expect(isIdRef("id:123")).toBe(false);
    expect(isIdRef("id:0b7f3d52-6a41-4c8e-9a2b-1f3c5d7e9a01")).toBe(true);
    expect(isIdRef("abc")).toBe(false);
    const inv = await st.createInvoice(db, { jobId, lines: [{ description: "x", amountCents: 1000 }] });
    expect(await st.invoiceByToken(db, `id:${inv.id}`)).toBeNull(); // draft invoices are not reachable
    await st.sendInvoice(db, inv.id);
    expect((await st.invoiceByToken(db, `id:${inv.id}`))?.id).toBe(inv.id);
    expect(await st.invoiceByToken(db, "id:00000000-0000-4000-8000-000000000000")).toBeNull();
    void eq;
  });
});
