import { Container, Section, Text } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import type { Metadata } from "next";
import { SchedulePicker } from "@/components/SchedulePicker";
import { Shell } from "@/components/Shell";
import "../../globals.css";

export const metadata: Metadata = { title: "Pick a time", description: "Book a consultation or a session online." };
export const dynamic = "force-dynamic";

export default function Schedule() {
  const minDate = new Date().toISOString().slice(0, 10);
  return (
    <Shell cta={false}>
      <PageHeader
        title={"Pick a time"}
        intro={"Choose a day, then a free time. Sessions are held while you pay the deposit."}
      />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <SchedulePicker minDate={minDate} />
        </Container>
      </Section>
    </Shell>
  );
}
