import { Container, Section, Text } from "@halation/ui";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { shootTypes } from "@/content/shoot-types";
import "../globals.css";

export const metadata: Metadata = { title: "Book", description: "Ask about a shoot or a licence." };

export default function Book() {
  return (
    <Shell>
      <Container className="page-head">
        <h1 className="hl-heading hl-heading--display">Book a shoot</h1>
        <Text size="xl" tone="muted" style={{ marginTop: "1.5rem", maxWidth: "36ch" }}>
          Pick the kind of shoot. I'll reply by email.
        </Text>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <ul className="book-types" aria-label="Kinds of shoot">
            {shootTypes.map((t) => (
              <li key={t.slug}>
                <Link href={`/book/${t.slug}`}>
                  <strong>{t.headline}</strong>
                  <span>{t.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Text size="sm" tone="muted" style={{ marginTop: "2rem" }}>
            Prefer email? <a href={`mailto:${person.bookingEmail}`}>{person.bookingEmail}</a>
          </Text>
        </Container>
      </Section>
    </Shell>
  );
}
