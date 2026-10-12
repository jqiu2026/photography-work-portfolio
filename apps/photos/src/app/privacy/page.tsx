import { Container, Prose, Section } from "@placeholder/ui";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = { title: "Privacy", description: "What the booking form and this site collect." };

// TODO(owner): have a lawyer review this text (Q13). Replace with the shared legal pages when R4 moves them into the
// shared package; until then this page lives on the site itself so no photography page links to another site.
export default function Privacy() {
  return (
    <Shell>
      <PageHeader eyebrow="Legal" title="Privacy" intro="Plain-language draft." />
      <Section style={{ paddingTop: 0 }}>
        <Container size="sm">
          <Prose>
            <p>I try to collect as little as possible.</p>
            <ul>
              <li>
                <strong>Server logs.</strong> Our host records standard request information (IP address, browser, pages
                requested) for security and reliability.
              </li>
              <li>
                <strong>Anonymous statistics.</strong> Vercel Analytics and Speed Insights, without cookies and without
                following you across sites.
              </li>
              <li>
                <strong>Messages.</strong> If you send a message through the booking form I store your name, email
                address and message so I can reply, plus a one-way hash of your IP address to limit spam. I keep it as
                long as it is useful and delete it on request.
              </li>
              <li>
                <strong>Your settings.</strong> Your light or dark choice is saved in your browser only.
              </li>
            </ul>
            <p>All photographs are © Jerry Qiu, all rights reserved, unless stated. Ask before you use one.</p>
          </Prose>
        </Container>
      </Section>
    </Shell>
  );
}
