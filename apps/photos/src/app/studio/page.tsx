import { Container, Eyebrow, Heading, Section, Text } from "@placeholder/ui";
import { sourceFromEnv } from "@jerryqiu/shootproof";
import { can } from "@jerryqiu/auth";
import Link from "next/link";
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
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
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
              <Link href="/studio/shootproof" className="ph-link">
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
              Coming in Phase 3
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
