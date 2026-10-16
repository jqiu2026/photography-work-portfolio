import { Container, Section, Text } from "@halation/ui";
import { getDb } from "@jerryqiu/db";
import * as portal from "@jerryqiu/db/portal";
import { ConfirmLoginButton } from "@/components/portal/PortalForms";
import { Shell } from "@/components/Shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

/** The emailed link lands here and only shows a button; pressing it uses the one-time token. */
export default async function Verify({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = "" } = await searchParams;
  const db = getDb();
  const ok = Boolean(db && t.length <= 80 && (await portal.peekToken(db, t, ["magic", "invite"])));
  return (
    <Shell>
      <Container className="page-head">
        <h1 className="hl-heading hl-heading--display">{ok ? "Almost there" : "This link has expired"}</h1>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          {ok ? (
            <ConfirmLoginButton token={t} />
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
