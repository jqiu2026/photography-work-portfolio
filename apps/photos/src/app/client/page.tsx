import { Button, Container, Section, Text } from "@halation/ui";
import { getDb } from "@jerryqiu/db";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { PassForm } from "@/components/studio/ClientForms";
import { shootproofUrl } from "@/content/nav";
import "../globals.css";

export const metadata: Metadata = { title: "Client galleries" };

export default function Client() {
  const portal = Boolean(getDb());
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
          {portal ? (
            <div style={{ marginTop: "2rem", maxWidth: "26rem" }}>
              <PassForm />
            </div>
          ) : null}
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {shootproofUrl ? (
              <Button as="a" href={shootproofUrl}>
                Galleries still on ShootProof
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
