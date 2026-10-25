import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as priv from "../src/privacy";
import * as schema from "../src/schema";
import * as st from "../src/studio";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
});

describe("client privacy", () => {
  it("exports what is held, then erases contact details but keeps the money records", async () => {
    const c = await st.createClient(db, { name: "Pat Person", email: "pat@example.com", phone: "555-0100" });
    const job = await st.createJob(db, { clientId: c.id, title: "Pat shoot" });
    const inv = await st.createInvoice(db, { jobId: job.id, lines: [{ description: "Day", amountCents: 10_000 }] });
    await db.insert(schema.studioMessages).values({ clientId: c.id, direction: "in", body: "hello" });
    const out = await priv.exportClientData(db, c.id);
    expect(out.client.email).toBe("pat@example.com");
    expect(out.invoices.map((i) => i.id)).toEqual([inv.id]);
    expect(out.messages).toHaveLength(1);
    await priv.eraseClient(db, c.id);
    const [after] = await db.select().from(schema.studioClients).where(eq(schema.studioClients.id, c.id));
    expect(after.name).toBe("Erased client");
    expect(after.email).toMatch(/@erased\.invalid$/);
    expect(after.phone).toBeNull();
    expect(await db.select().from(schema.studioMessages).where(eq(schema.studioMessages.clientId, c.id))).toHaveLength(
      0,
    );
    expect(await db.select().from(schema.studioInvoices).where(eq(schema.studioInvoices.id, inv.id))).toHaveLength(1);
    await expect(priv.eraseClient(db, c.id)).rejects.toThrow("already erased");
  });
});
