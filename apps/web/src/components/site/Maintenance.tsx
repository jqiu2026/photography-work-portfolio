import { Container, Heading, Text } from "./ui";

/** Shown instead of the site while maintenance mode is on (the admin stays reachable). */
export function Maintenance({ message }: { message?: string }) {
  return (
    <main id="main">
      <Container size="sm" style={{ paddingBlock: "20vh" }}>
        <Heading as="h1" size="3xl">
          Back soon
        </Heading>
        <Text tone="muted" style={{ marginTop: "1rem" }}>
          {message || "This site is being updated. Please check back shortly."}
        </Text>
      </Container>
    </main>
  );
}
