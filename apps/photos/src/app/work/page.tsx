import { Container, Section } from "@placeholder/ui";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";
import { WorkGrid } from "@/components/work/WorkGrid";
import "@/components/work/work.css";
import { getWork } from "@/lib/work";

export const metadata: Metadata = {
  title: "Work",
  description: "Photography and video projects: events, theatre and community work.",
};

export default async function Work() {
  const projects = await getWork();
  return (
    <Shell>
      <PageHeader
        eyebrow="Work"
        title="Things I've made"
        intro="A collection of personal and commissioned photography and video projects."
      />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <WorkGrid projects={projects} />
        </Container>
      </Section>
    </Shell>
  );
}
