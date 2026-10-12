import { Container, Eyebrow, Heading, Section, Text } from "@halation/ui";
import { sourceFromEnv } from "@jerryqiu/shootproof";
import { can } from "@jerryqiu/auth";
import { mocksEnabled } from "@jerryqiu/mocks";
import { MockBanner } from "@jerryqiu/sites/mock";
import Link from "next/link";
import { studioSections } from "@/components/studio/sections";
import { Shell } from "@/components/Shell";
import { requirePageUser } from "@/auth";
import "../globals.css";

export const metadata = { title: "Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const roadmap = [
  "Client galleries with passcodes, favourites and downloads",
  "Contracts and e-signatures",
  "Invoices and payments",
  "Bookings and a client portal",
];

export default async function Studio() {
  const user = await requirePageUser("studio.access", "/studio");
  const sp = sourceFromEnv();
  return (
    <Shell>
      <Container className="page-head">
        <Eyebrow style={{ marginBottom: "1rem" }}>Studio</Eyebrow>
        <Heading as="h1" size="display" display>
          Hello, {user.name?.split(" ")[0] ?? "there"}
        </Heading>
      </Container>
      {mocksEnabled() ? <MockBanner what="The business tools below are local mocks" /> : null}
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          {mocksEnabled() ? (
            <div className="studio-card" style={{ marginBottom: "1.5rem" }}>
              <Heading as="h2" size="2xl">
                Studio (mock)
              </Heading>
              <Text tone="muted" size="sm" style={{ margin: "0.5rem 0 1rem" }}>
                Clients, shoots, galleries, contracts and invoices. Everything is sample data stored in this browser.
              </Text>
              <ul className="studio-steps">
                {studioSections.map((x) => (
                  <li key={x.id}>
                    <Link href={`/studio/${x.id}`} className="hl-link">
                      {x.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="studio-card">
            <Heading as="h2" size="2xl">
              ShootProof bridge
            </Heading>
            <Text tone="muted" style={{ margin: "0.5rem 0 1rem" }}>
              {sp.state === "unconfigured"
                ? "Not connected. It needs an API client ID from ShootProof; the steps are on the next page."
                : sp.source.mode === "mock"
                  ? "Sample mode (fixtures only)."
                  : "Set up. Import an event to show it here for a day."}
            </Text>
            {can(user.role, "shootproof.manage") ? (
              <Link href="/studio/shootproof" className="hl-link">
                Open ShootProof bridge
              </Link>
            ) : (
              <Text size="sm" tone="muted">
                Only the owner can use the bridge.
              </Text>
            )}
          </div>
          <div className="studio-card" style={{ marginTop: "1.5rem" }}>
            <Heading as="h2" size="2xl">
              Phase 3 replaces the mocks with real services
            </Heading>
            <Text tone="muted" size="sm" style={{ margin: "0.5rem 0" }}>
              Not started. This replaces the need for ShootProof.
            </Text>
            <ul className="studio-steps">
              {roadmap.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>
    </Shell>
  );
}
