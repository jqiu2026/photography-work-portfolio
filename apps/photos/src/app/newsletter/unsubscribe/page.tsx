import { getDb } from "@jerryqiu/db";
import { unsubscribe } from "@jerryqiu/db/newsletter";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";
import { Button, Container, Section } from "@/components/ui";
import "../../globals.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

/** One click, no sign-in, no questions. */
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const db = getDb();
  const ok = Boolean(t && db && (await unsubscribe(db, t)));
  return (
    <Shell cta={false}>
      <PageHeader
        eyebrow="Newsletter"
        title={ok ? "You're unsubscribed" : "That link didn't work"}
        intro={
          ok
            ? "You won't get any more newsletters."
            : "It may be out of date. Reply to any newsletter and I'll remove you by hand."
        }
      />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <Button asChild variant="secondary">
            <Link href="/">Back to the site</Link>
          </Button>
        </Container>
      </Section>
    </Shell>
  );
}
