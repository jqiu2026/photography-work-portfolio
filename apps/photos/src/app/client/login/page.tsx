import { Container, Section, Text } from "@halation/ui";
import { redirect } from "next/navigation";
import { LoginForms } from "@/components/portal/PortalForms";
import { Shell } from "@/components/Shell";
import { accountSession } from "@/lib/account-session";
import "@/components/studio/studio.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function ClientLogin() {
  if (await accountSession()) redirect("/client/home");
  return (
    <Shell>
      <Container className="page-head">
        <h1 className="hl-heading hl-heading--display">Client sign-in</h1>
        <Text size="xl" tone="muted" style={{ marginTop: "1.5rem", maxWidth: "36ch" }}>
          Your galleries, contracts, invoices and messages in one place.
        </Text>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <LoginForms />
          <Text size="sm" tone="muted" style={{ marginTop: "2rem" }}>
            Have a gallery passcode instead? <a href="/client">Open a gallery with it</a>.
          </Text>
        </Container>
      </Section>
    </Shell>
  );
}
