import { Container, Section, Text } from "@halation/ui";
import type { Metadata } from "next";
import { SchedulePicker } from "@/components/SchedulePicker";
import { Shell } from "@/components/Shell";
import "../../globals.css";

export const metadata: Metadata = { title: "Pick a time", description: "Book a consultation or a session online." };
export const dynamic = "force-dynamic";

export default function Schedule() {
  const minDate = new Date().toISOString().slice(0, 10);
  return (
    <Shell>
      <Container className="page-head">
        <h1 className="hl-heading hl-heading--display">Pick a time</h1>
        <Text size="xl" tone="muted" style={{ marginTop: "1.5rem", maxWidth: "36ch" }}>
          Choose a day, then a free time. Sessions are held while you pay the deposit.
        </Text>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <SchedulePicker minDate={minDate} />
        </Container>
      </Section>
    </Shell>
  );
}
