import "@halation/ui/styles.css";
import { Button, Container, Field, Heading, Input, Row, Text, ThemeProvider, Timeline } from "@halation/ui";
import { InView } from "@halation/ui/motion";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider preset="hub">
    <Container size="md" style={{ paddingBlock: "4rem" }}>
      <Heading as="h1" size="display" display>
        Hello from Vite
      </Heading>
      <Text tone="muted" size="xl" style={{ margin: "1rem 0 2rem" }}>
        The package works outside Next.js.
      </Text>
      <InView>
        <Row gap={3}>
          <Button>Solid</Button>
          <Button variant="ghost">Ghost</Button>
        </Row>
      </InView>
      <div style={{ margin: "2rem 0", maxWidth: 360 }}>
        <Field label="Email" hint="Plain CSS, no Tailwind.">
          <Input placeholder="you@example.com" />
        </Field>
      </div>
      <Timeline items={[{ title: "Installed from a tarball", period: "now" }]} />
    </Container>
  </ThemeProvider>,
);
