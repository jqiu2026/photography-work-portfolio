import { Button, Container, Grid, Section, Text } from "@/components/ui";
import { getDb } from "@jerryqiu/db";
import { publicTestimonials } from "@jerryqiu/db/business";
import { PageHeader } from "@/components/PageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import "../globals.css";

export const metadata: Metadata = { title: "About", description: "About the photographer." };

export const revalidate = 60;

/** Only testimonials the person agreed to make public (published with recorded consent) are ever read here. */
async function quotes() {
  try {
    const db = getDb();
    return db ? await publicTestimonials(db) : [];
  } catch {
    return [];
  }
}

export default async function About() {
  const said = await quotes();
  return (
    <Shell>
      <PageHeader eyebrow="About" title="About the photographer" />
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          <Grid cols={2} gap={12}>
            {/* TODO(owner): rewrite in your own voice. Facts are from the original About page. */}
            <Text size="xl">
              Jerry is a creator and photographer based in New York City. He approaches photography thoughtfully, aiming
              to capture moments that matter. He has contributed to several non-profits and his high school through his
              work.
            </Text>
            <div>
              <Text tone="muted">I photograph theater, school and community events, street scenes and aircraft.</Text>
              <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button asChild>
                  <Link href="/book">Book a shoot</Link>
                </Button>
              </div>
            </div>
          </Grid>
        </Container>
      </Section>
      {said.length ? (
        <Section style={{ paddingTop: 0 }}>
          <Container size="md">
            <ul className="about-quotes" aria-label="What clients say">
              {said.map((q) => (
                <li key={q.id}>
                  <blockquote>“{q.quote}”</blockquote>
                  <p>
                    {q.displayName}
                    {q.role ? `, ${q.role}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </Shell>
  );
}
