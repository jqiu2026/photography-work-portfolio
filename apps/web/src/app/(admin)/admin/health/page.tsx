import { getDb, hasDatabase } from "@jerryqiu/db";
import { createStorage } from "@jerryqiu/storage";
import { sql } from "drizzle-orm";
import { PageHead } from "@/components/admin/ui";
import { requirePageUser } from "@/auth";

export const metadata = { title: "Health" };

type Check = { name: string; ok: boolean | "warn"; detail: string };

async function checks(): Promise<Check[]> {
  const env = (k: string) => Boolean(process.env[k]);
  const out: Check[] = [];
  const placeholder = /dev-only/.test(process.env.AUTH_SECRET ?? "");
  out.push({
    name: "AUTH_SECRET",
    ok: env("AUTH_SECRET") && !placeholder ? true : process.env.NODE_ENV === "production" ? false : "warn",
    detail: env("AUTH_SECRET") ? (placeholder ? "development placeholder in use" : "set") : "missing",
  });
  out.push({
    name: "Google sign-in",
    ok: env("AUTH_GOOGLE_ID") && env("AUTH_GOOGLE_SECRET") ? true : "warn",
    detail: env("AUTH_GOOGLE_ID")
      ? "credentials present"
      : "AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET not set (docs/google-oauth-setup.md)",
  });
  out.push({ name: "Allowed domain", ok: true, detail: process.env.ALLOWED_EMAIL_DOMAIN || "jerryqiu.com (default)" });
  out.push({
    name: "Open sign-in",
    ok: process.env.NODE_ENV === "production" ? true : "warn",
    detail:
      process.env.NODE_ENV === "production"
        ? "disabled in production builds"
        : process.env.DASHBOARD_OPEN_SIGNIN === "true"
          ? "ON (development only)"
          : "off",
  });
  if (hasDatabase()) {
    try {
      const t0 = Date.now();
      await getDb()?.execute(sql`select 1`);
      out.push({ name: "Database", ok: true, detail: `reachable (${Date.now() - t0} ms)` });
    } catch (e) {
      out.push({ name: "Database", ok: false, detail: `unreachable: ${(e as Error).message.slice(0, 120)}` });
    }
  } else out.push({ name: "Database", ok: "warn", detail: "DATABASE_URL not set; public sites use repo content" });
  for (const store of ["originals", "public"] as const) {
    try {
      const s = createStorage(store);
      const key = `health/${Date.now()}.txt`;
      await s.put(key, new TextEncoder().encode("ok"), { contentType: "text/plain" });
      const got = await s.get(key);
      await s.delete(key);
      out.push({
        name: `Storage: ${store}`,
        ok: Boolean(got),
        detail: `${s.name} driver, write/read/delete ${got ? "ok" : "failed"}`,
      });
    } catch (e) {
      out.push({ name: `Storage: ${store}`, ok: false, detail: (e as Error).message.slice(0, 140) });
    }
  }
  out.push({
    name: "Email (Resend)",
    ok: env("RESEND_API_KEY") ? true : "warn",
    detail: env("RESEND_API_KEY") ? "key present" : "RESEND_API_KEY not set; contact notifications are off",
  });
  out.push({
    name: "Cron secret",
    ok: env("CRON_SECRET") ? true : "warn",
    detail: env("CRON_SECRET") ? "set" : "not set; purge routes refuse requests",
  });
  return out;
}

export default async function Health() {
  await requirePageUser("any", "/admin/health");
  const list = await checks();
  return (
    <>
      <PageHead
        title="Health"
        lede="What is configured, and whether it works. Names and status only; secrets are never shown."
      />
      <table className="adm-table">
        <thead>
          <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.name}>
              <td>{c.name}</td>
              <td className={c.ok === true ? "adm-ok" : c.ok === "warn" ? "adm-warn" : "adm-bad"}>
                {c.ok === true ? "OK" : c.ok === "warn" ? "Needs setup" : "Problem"}
              </td>
              <td className="adm-note">{c.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="adm-note" style={{ marginTop: "1.5rem" }}>
        Node {process.version} · {process.env.NODE_ENV} · build{" "}
        {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}
      </p>
    </>
  );
}
