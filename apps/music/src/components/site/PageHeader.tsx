import { Container, Eyebrow, Heading, Text } from "@halation/ui";
import type { ReactNode } from "react";

/** Standard top of an inner page: eyebrow, large display title, optional intro. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: { eyebrow?: string; title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <Container style={{ paddingTop: "clamp(3rem, 10vw, 8rem)", paddingBottom: "clamp(2rem, 6vw, 5rem)" }}>
      {eyebrow ? <Eyebrow style={{ marginBottom: "1.25rem" }}>{eyebrow}</Eyebrow> : null}
      <Heading as="h1" size="display" display style={{ maxWidth: "14ch" }}>
        {title}
      </Heading>
      {intro ? (
        <Text size="xl" tone="muted" style={{ marginTop: "1.75rem", maxWidth: "38ch" }}>
          {intro}
        </Text>
      ) : null}
      {children}
    </Container>
  );
}
