import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { type Database, schema } from "@jerryqiu/db";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import { createResendProvider, providerFromEnv, renderEmail, sendEmail, sendTemplate } from "../src";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../../db/drizzle") });
  db = d as unknown as Database;
});

describe("templates", () => {
  it("escapes every value and never embeds markup from the data", () => {
    const r = renderEmail("inquiry-received", { name: '<img src=x onerror="a">', summary: "<script>1</script>" });
    expect(r.html).not.toContain("<img");
    expect(r.html).not.toContain("<script>");
    expect(r.html).toContain("&lt;script&gt;");
  });
  it("only links http(s) and strips newlines from subjects", () => {
    const r = renderEmail("reminder", { title: "Hello\r\nBcc: x@y.z", link: "javascript:alert(1)", linkLabel: "Go" });
    expect(r.subject).not.toMatch(/[\r\n]/);
    expect(r.html).not.toContain("javascript:");
    expect(renderEmail("invoice-sent", { link: "https://photo.example/pay/1", linkLabel: "Pay" }).html).toContain(
      'href="https://photo.example/pay/1"',
    );
  });
  it("has a plain-text part for every kind", () => {
    for (const k of ["inquiry-received", "magic-link", "gallery-ready", "invoice-sent", "payment-receipt"] as const)
      expect(renderEmail(k, { name: "Ada", link: "https://x.test/a" }).text).toContain("Ada");
  });
});

describe("provider choice", () => {
  it("uses Resend only when both the key and the sender are set", () => {
    expect(providerFromEnv({ RESEND_API_KEY: "k", EMAIL_FROM: "a@b.co", NODE_ENV: "production" }).name).toBe("resend");
    expect(providerFromEnv({ RESEND_API_KEY: "k", NODE_ENV: "development" }).name).toBe("mock");
  });
  it("production without keys sends nothing and says so", async () => {
    const p = providerFromEnv({ NODE_ENV: "production" });
    expect(p.name).toBe("none");
    const r = await sendEmail(
      db,
      { to: "a@b.co", subject: "s", text: "t" },
      { kind: "reply", env: { NODE_ENV: "production" }, provider: p },
    );
    expect(r.status).toBe("skipped");
    expect(r.error).toContain("RESEND_API_KEY");
  });
});

describe("sending and the log", () => {
  it("calls the Resend API with a bearer key, reply-to and no CR/LF in the subject, and logs it as sent", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const fake = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ id: "re_123" }), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await sendEmail(
      db,
      {
        to: "Client@Example.com",
        subject: "Hi\r\nBcc: evil@x.co",
        text: "body",
        replyTo: "me@jerryqiu.com",
        from: "S <s@m.example>",
      },
      { kind: "reply", provider: createResendProvider("key_x", fake), related: { type: "booking", id: "b1" } },
    );
    expect(r).toMatchObject({ ok: true, status: "sent", id: "re_123" });
    expect(seen?.url).toBe("https://api.resend.com/emails");
    expect((seen?.init.headers as Record<string, string>).Authorization).toBe("Bearer key_x");
    const body = JSON.parse(String(seen?.init.body));
    expect(body.subject).not.toMatch(/[\r\n]/);
    expect(body.reply_to).toBe("me@jerryqiu.com");
    const row = (await db.select().from(schema.emailLog)).find((x) => x.relatedId === "b1");
    expect(row).toMatchObject({ toEmail: "client@example.com", status: "sent", provider: "resend", relatedId: "b1" });
  });
  it("records a rejected send as failed, and an invalid address without calling the provider", async () => {
    const bad = (async () =>
      new Response(JSON.stringify({ message: "domain not verified" }), { status: 403 })) as unknown as typeof fetch;
    const r = await sendEmail(
      db,
      { to: "a@b.co", subject: "s", text: "t" },
      { kind: "reply", provider: createResendProvider("k", bad) },
    );
    expect(r.status).toBe("failed");
    expect(r.error).toContain("domain not verified");
    let called = false;
    const spy = (async () => {
      called = true;
      return new Response("{}");
    }) as unknown as typeof fetch;
    const inv = await sendEmail(
      db,
      { to: "not an email", subject: "s", text: "t" },
      { kind: "reply", provider: createResendProvider("k", spy) },
    );
    expect(inv.ok).toBe(false);
    expect(called).toBe(false);
  });
  it("the labelled mock outbox records the email and nothing is sent", async () => {
    const r = await sendTemplate(
      db,
      "ada@example.com",
      "gallery-ready",
      { name: "Ada", link: "https://x.test/g" },
      { env: { NODE_ENV: "development" } },
    );
    expect(r.status).toBe("mock");
    const rows = await db.select().from(schema.emailLog);
    const row = rows.find((x) => x.kind === "gallery-ready");
    expect(row?.provider).toBe("mock");
    expect(row?.bodyText).toContain("Ada");
  });
});
