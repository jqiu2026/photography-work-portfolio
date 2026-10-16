import { Container, Eyebrow, Heading, Section, Text } from "@halation/ui";
import Link from "next/link";
import { studioSections } from "@/components/studio/sections";
import { Shell } from "@/components/Shell";
import { requirePageUser } from "@/auth";
import "../globals.css";

export const metadata = { title: "Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const roadmap = [
  "Downloads with per-viewer watermarks and a download log",
  "Emailed links (Resend) instead of copying them",
  "Stripe live payments (test mode needs your Stripe key)",
  "Signed PDF contracts and a booking calendar",
];

export default async function Studio() {
  const user = await requirePageUser("studio.access", "/studio");
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
          <div className="studio-card" style={{ marginBottom: "1.5rem" }}>
            <Heading as="h2" size="2xl">
              Studio
            </Heading>
            <Text tone="muted" size="sm" style={{ margin: "0.5rem 0 1rem" }}>
              Clients, jobs, client galleries, contracts, invoices and bookings.
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
          <div className="studio-card">
            <Heading as="h2" size="2xl">
              Still to come
            </Heading>
            <Text tone="muted" size="sm" style={{ margin: "0.5rem 0" }}>
              The studio above is built; these pieces are on the plan in docs/project/PROGRESS.md.
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
