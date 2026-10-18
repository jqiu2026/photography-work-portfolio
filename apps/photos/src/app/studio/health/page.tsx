import { getDb } from "@jerryqiu/db";
import {
  Container,
  DataList,
  DataListItem,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Section,
  Status,
} from "@/components/ui";
import { requirePageUser } from "@/auth";
import { StudioShell as Shell } from "@/components/studio/StudioShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Health", robots: { index: false, follow: false } };

type Check = { name: string; ok: boolean | "warn"; detail: string };

/** What is configured, by name only (never a value). Owner only. */
export default async function Health() {
  await requirePageUser("studio.access", "/studio/health");
  const env = (k: string) => Boolean(process.env[k]?.trim());
  const db = getDb();
  let dbOk: Check = { name: "Database", ok: false, detail: "DATABASE_URL is not set" };
  if (db) {
    try {
      await db.execute("select 1" as never);
      dbOk = { name: "Database", ok: true, detail: "connected" };
    } catch (e) {
      dbOk = { name: "Database", ok: false, detail: String((e as Error).message).slice(0, 120) };
    }
  }
  const checks: Check[] = [
    dbOk,
    {
      name: "Image token secret",
      ok: env("IMAGE_TOKEN_SECRET") || env("AUTH_SECRET"),
      detail: "Needed for every photograph: without it no image loads (set AUTH_SECRET or IMAGE_TOKEN_SECRET)",
    },
    {
      name: "Storage",
      ok: (process.env.STORAGE_DRIVER ?? "local") === "blob" ? env("BLOB_READ_WRITE_TOKEN") : "warn",
      detail: `driver ${process.env.STORAGE_DRIVER ?? "local"}${(process.env.STORAGE_DRIVER ?? "local") === "local" ? " (development only)" : ""}`,
    },
    {
      name: "Email (Resend)",
      ok: env("RESEND_API_KEY") && env("EMAIL_FROM") ? true : "warn",
      detail: env("RESEND_API_KEY")
        ? "key present"
        : "TODO(owner): needs RESEND_API_KEY and EMAIL_FROM; emails are recorded, not sent",
    },
    {
      name: "Reply inbox",
      ok: env("EMAIL_REPLY_TO") || env("CONTACT_TO_EMAIL") ? true : "warn",
      detail: "EMAIL_REPLY_TO or CONTACT_TO_EMAIL",
    },
    {
      name: "Stripe",
      ok: env("STRIPE_SECRET_KEY") && env("STRIPE_WEBHOOK_SECRET") ? true : "warn",
      detail: env("STRIPE_SECRET_KEY")
        ? "keys present"
        : "TODO(owner): needs STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET; payments use the labelled mock",
    },
    {
      name: "Cron secret",
      ok: env("CRON_SECRET") ? true : "warn",
      detail: "CRON_SECRET (scheduled jobs refuse to run without it)",
    },
    {
      name: "Cache refresh secret",
      ok: env("REVALIDATE_SECRET") ? true : "warn",
      detail: "REVALIDATE_SECRET (same value as the hub)",
    },
    {
      name: "Mocks",
      ok: process.env.NODE_ENV === "production" && process.env.ENABLE_MOCKS !== "true" ? true : "warn",
      detail:
        process.env.NODE_ENV === "production"
          ? process.env.ENABLE_MOCKS === "true"
            ? "ENABLE_MOCKS is on (preview only)"
            : "off"
          : "development: mocks are on",
    },
  ];
  return (
    <Shell>
      <Section>
        <Container size="md">
          <PageHeader>
            <PageEyebrow>Studio</PageEyebrow>
            <PageTitle>Health</PageTitle>
            <PageDescription>What is configured, by name only. Values are never shown.</PageDescription>
          </PageHeader>
          <DataList aria-label="Checks">
            {checks.map((c) => (
              <DataListItem
                key={c.name}
                data-check={c.name}
                description={c.detail}
                meta={
                  <Status tone={c.ok === true ? "success" : c.ok === "warn" ? "warning" : "danger"}>
                    {c.ok === true ? "ok" : c.ok === "warn" ? "check" : "missing"}
                  </Status>
                }
              >
                {c.name}
              </DataListItem>
            ))}
          </DataList>
        </Container>
      </Section>
    </Shell>
  );
}
