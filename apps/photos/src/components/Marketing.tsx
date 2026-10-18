import { Container, Section, Text } from "@/components/ui";
import type { ReactNode } from "react";
import { Shell } from "@/components/Shell";
import { type FeatureStatus, statusLabel } from "@/content/features";
import "@/app/globals.css";

export function Page({
  title,
  lede,
  children,
  cinema = false,
}: { title: string; lede?: string; children: ReactNode; cinema?: boolean }) {
  return (
    <Shell cinema={cinema}>
      <Container className="page-head">
        <h1 className="hl-heading hl-heading--display">{title}</h1>
        {lede ? (
          <Text size="xl" tone="muted" style={{ marginTop: "1.5rem", maxWidth: "44ch" }}>
            {lede}
          </Text>
        ) : null}
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container size="md" className="mk">
          {children}
        </Container>
      </Section>
    </Shell>
  );
}

export function Badge({ status }: { status: FeatureStatus }) {
  return (
    <span className="mk-badge" data-status={status}>
      {statusLabel[status]}
    </span>
  );
}

export function Sample({
  children = "SAMPLE data: nothing here is a real client, price or photograph.",
}: { children?: ReactNode }) {
  return (
    <p className="pk-note" role="note">
      {children}
    </p>
  );
}
