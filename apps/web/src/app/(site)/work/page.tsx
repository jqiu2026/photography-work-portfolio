import { Container, Section } from "@placeholder/ui";
import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { SiteShell } from "@/components/site/SiteShell";
import { WorkGrid } from "@/components/work/WorkGrid";
import "@/components/work/work.css";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description: "Photography and video projects: events, theatre and community work.",
};

export default function Work() {
  return (
    <SiteShell transparentTop={false}>
      <PageHeader
        eyebrow="Work"
        title="Things I've made"
        intro="A collection of personal and commissioned photography and video projects."
      />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <WorkGrid projects={getProjects()} />
        </Container>
      </Section>
    </SiteShell>
  );
}
