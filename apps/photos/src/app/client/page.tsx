import { Button, Container, Section, Text } from "@halation/ui";
import { mocksEnabled } from "@jerryqiu/mocks";
import { person } from "@jerryqiu/sites/profile";
import { MockBanner } from "@jerryqiu/sites/mock";
import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { PortalEntry } from "@/components/studio/ClientPortal";
import { shootproofUrl } from "@/content/nav";
import "../globals.css";

export const metadata: Metadata = { title: "Client galleries" };

export default function Client() {
  const mock = mocksEnabled();
  return (
    <Shell>
      <Container className="page-head">
        <h1 className="hl-heading hl-heading--display">Client galleries</h1>
      </Container>
      {mock ? <MockBanner what="The client portal is a local mock" /> : null}
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          <Text size="xl" style={{ maxWidth: "40ch" }}>
            If I photographed your event, your gallery link was sent to you by email.
          </Text>
          {mock ? (
            <div style={{ marginTop: "2rem" }}>
              <PortalEntry />
            </div>
          ) : null}
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {shootproofUrl ? (
              <Button as="a" href={shootproofUrl}>
                Open my gallery
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
