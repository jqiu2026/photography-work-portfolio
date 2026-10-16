import { Button, Container, Section, Text } from "@halation/ui";
import { getDb } from "@jerryqiu/db";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { PassForm } from "@/components/studio/ClientForms";
import "../globals.css";

export const metadata: Metadata = { title: "Client galleries" };

export default async function Client({ searchParams }: { searchParams: Promise<{ locked?: string; idle?: string }> }) {
  const portal = Boolean(getDb());
  const q = await searchParams;
  return (
    <Shell>
      <Container className="page-head">
        <h1 className="hl-heading hl-heading--display">Client galleries</h1>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          <Text size="xl" style={{ maxWidth: "40ch" }}>
            If I photographed your event, you were given a passcode for your gallery.
          </Text>
          {q.locked ? (
            <p role="alert" className="st-error" style={{ marginTop: "1.5rem", maxWidth: "40ch" }}>
              This gallery was closed because a screenshot or save was attempted. It reopens after a short wait, or
              email me and I can let you back in.
            </p>
          ) : null}
          {q.idle ? (
            <p role="status" className="st-note" style={{ marginTop: "1.5rem" }}>
              The gallery was closed after a period of inactivity. Enter your passcode to open it again.
            </p>
          ) : null}
          {portal ? (
            <div style={{ marginTop: "2rem", maxWidth: "26rem" }}>
              <PassForm />
            </div>
          ) : null}
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {portal ? (
              <Button as="a" href="/client/login" variant="ghost">
                Sign in to my portal
              </Button>
            ) : null}
            <Button as="a" href={`mailto:${person.bookingEmail}`} variant="ghost">
              Can't find it? Email me
            </Button>
          </div>
        </Container>
      </Section>
    </Shell>
  );
}
