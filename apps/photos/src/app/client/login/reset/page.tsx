import { Container, Section, Text } from "@halation/ui";
import { getDb } from "@jerryqiu/db";
import * as portal from "@jerryqiu/db/portal";
import { ResetForm } from "@/components/portal/PortalForms";
import { Shell } from "@/components/Shell";
import "@/components/studio/studio.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Choose a password", robots: { index: false, follow: false } };

export default async function Reset({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = "" } = await searchParams;
  const db = getDb();
  const ok = Boolean(db && t.length <= 80 && (await portal.peekToken(db, t, ["reset", "invite"])));
  return (
    <Shell>
      <Container className="page-head">
        <h1 className="hl-heading hl-heading--display">{ok ? "Choose a password" : "This link has expired"}</h1>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          {ok ? (
            <ResetForm token={t} />
          ) : (
            <Text size="xl" tone="muted">
              The link was already used or is too old. <a href="/client/login">Ask for a new one</a>.
            </Text>
          )}
        </Container>
      </Section>
    </Shell>
  );
}
