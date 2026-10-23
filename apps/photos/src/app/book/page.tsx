import { Button, CalendarIcon, ClockIcon } from "@holominimal/ui";
import { BookingWizard } from "@/components/BookingWizard";
import { PageHeader } from "@/components/PageHeader";
import { Container, Section, Text } from "@/components/ui";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { shootTypes } from "@/content/shoot-types";
import "../globals.css";

export const metadata: Metadata = { title: "Book", description: "Ask about a shoot or a license." };

export default async function Book({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const q = (await searchParams).type;
  const initialType = shootTypes.some((t) => t.slug === q) ? q : undefined;
  return (
    <Shell cta={false}>
      <PageHeader
        eyebrow="Book"
        title="Book a shoot"
        intro="A few quick questions, one at a time. I'll reply by email."
      />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <BookingWizard fallbackEmail={person.bookingEmail} initialType={initialType} />
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
