import { Alert, Badge as HmBadge } from "@holominimal/ui";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";
import { Container, Section } from "@/components/ui";
import { type FeatureStatus, statusLabel } from "@/content/features";
import "@/app/globals.css";

/** An inner marketing page: the shared page header, then a reading-width column. */
export function Page({
  title,
  lede,
  eyebrow,
  children,
}: { title: string; lede?: string; eyebrow?: string; children: ReactNode; cinema?: boolean }) {
  return (
    <Shell>
      <PageHeader eyebrow={eyebrow} title={title} intro={lede} />
      <Section style={{ paddingTop: 0 }}>
        <Container size="md" className="mk">
          {children}
        </Container>
      </Section>
    </Shell>
  );
}

const TONE: Record<FeatureStatus, "success" | "accent" | "muted"> = {
  live: "success",
  preview: "accent",
  soon: "muted",
};

export function Badge({ status }: { status: FeatureStatus }) {
  return (
    <HmBadge tone={TONE[status]} className="mk-badge" data-status={status}>
      {statusLabel[status]}
    </HmBadge>
  );
}

export function Sample({
  children = "SAMPLE data: nothing here is a real client, price or photograph.",
}: { children?: ReactNode }) {
  return (
    <Alert tone="info" role="note" className="pk-note">
      {children}
    </Alert>
  );
}
