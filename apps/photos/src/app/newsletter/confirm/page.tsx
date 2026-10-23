import { getDb } from "@jerryqiu/db";
import { confirmSubscriber } from "@jerryqiu/db/newsletter";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";
import { Button, Container, Section, Text } from "@/components/ui";
import "../../globals.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confirm your email", robots: { index: false, follow: false } };

/** The link in the confirmation email. Opening it confirms; the address is on the list from then on. */
export default async function Confirm({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const db = getDb();
  const ok = Boolean(t && db && (await confirmSubscriber(db, t)));
  return (
    <Shell cta={false}>
      <PageHeader
        eyebrow="Newsletter"
        title={ok ? "You're on the list" : "That link didn't work"}
        intro={
          ok
            ? "Thank you. You can unsubscribe from any email with one click."
            : "It may have been used already or replaced by a newer one. You can sign up again from the footer of any page."
        }
      />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <Text tone="muted">Nothing else is shared, and no one else sees your address.</Text>
          <p style={{ marginTop: "var(--hm-space-5)" }}>
            <Button asChild variant="secondary">
              <Link href="/">Back to the site</Link>
            </Button>
          </p>
        </Container>
      </Section>
    </Shell>
  );
}
