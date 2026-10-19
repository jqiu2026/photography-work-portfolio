import { Button, CalendarIcon, ClockIcon, Surface } from "@holominimal/ui";
import { PageHeader } from "@/components/PageHeader";
import { Container, Section, Text } from "@/components/ui";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { shootTypes } from "@/content/shoot-types";
import "../globals.css";

export const metadata: Metadata = { title: "Book", description: "Ask about a shoot or a license." };

export default function Book() {
  return (
    <Shell cta={false}>
      <PageHeader eyebrow="Book" title="Book a shoot" intro="Pick the kind of shoot. I'll reply by email." />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <ul className="book-types" aria-label="Kinds of shoot">
            {shootTypes.map((t) => (
              <li key={t.slug}>
                <Surface asChild variant="outlined" interactive lit padding="md">
                  <Link href={`/book/${t.slug}`}>
                    <strong>{t.headline}</strong>
                    <span>{t.blurb}</span>
                  </Link>
                </Surface>
              </li>
            ))}
          </ul>
          <div className="book-more">
            <Button asChild variant="secondary">
              <Link href="/book/schedule">
                <CalendarIcon /> Pick a time online
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/book/minis">
                <ClockIcon /> Mini-sessions
              </Link>
            </Button>
          </div>
          <Text size="sm" tone="muted" style={{ marginTop: "var(--hm-space-4)" }}>
            Prefer email? <a href={`mailto:${person.bookingEmail}`}>{person.bookingEmail}</a>
          </Text>
        </Container>
      </Section>
    </Shell>
  );
}
