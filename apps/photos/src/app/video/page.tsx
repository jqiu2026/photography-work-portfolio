import { Container, Section, Text } from "@placeholder/ui";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = { title: "Video", description: "Video work." };

/**
 * Video portfolio. Q39: sources (self-hosted clips, YouTube/Vimeo click-to-load embeds) are not decided, so until the
 * owner supplies videos this is an honest empty state. The page, route and nav entry exist; R3/R4 designs the gallery.
 */
export default function Video() {
  return (
    <Shell>
      <PageHeader eyebrow="Video" title="Moving pictures" intro="Video work is coming to this page." />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <Text tone="muted">
            {/* TODO(owner): supply videos (Q39); embeds load only after a press. */}
            Nothing here yet.
          </Text>
        </Container>
      </Section>
    </Shell>
  );
}
