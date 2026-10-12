import { Container, Section, Text } from "@placeholder/ui";
import { ContactForm } from "@jerryqiu/sites/contact";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import "../globals.css";

export const metadata: Metadata = { title: "Book", description: "Ask about a shoot or a licence." };

export default function Book() {
  return (
    <Shell>
      <Container className="page-head">
        <h1 className="ph-heading ph-heading--display">Book a shoot</h1>
        <Text size="xl" tone="muted" style={{ marginTop: "1.5rem", maxWidth: "36ch" }}>
          Tell me about the event or idea. I'll reply by email.
        </Text>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <ContactForm
            to={person.bookingEmail}
            endpoint="/api/contact"
            topics={["Event", "Performance", "Portrait", "Licensing a photograph", "Something else"]}
            privacyHref="/privacy"
          />
        </Container>
      </Section>
    </Shell>
  );
}
