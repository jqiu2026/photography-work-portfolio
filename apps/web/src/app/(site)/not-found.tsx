import { Button, Container, Heading, Text } from "@placeholder/ui";
import NextLink from "next/link";
import { SiteShell } from "@/components/site/SiteShell";

export default function NotFound() {
  return (
    <SiteShell transparentTop={false}>
      <Container size="sm" style={{ paddingBlock: "8rem" }}>
        <Heading as="h1" size="display" display>
          Not found
        </Heading>
        <Text size="lg" tone="muted" style={{ margin: "1.5rem 0 2rem" }}>
          That page doesn't exist, or it moved.
        </Text>
        <Button as={NextLink} href="/">
          Back home
        </Button>
      </Container>
    </SiteShell>
  );
}
