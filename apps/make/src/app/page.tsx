import { Container, Heading, Text } from "@halation/ui";

export default function Home() {
  return (
    <main id="main">
      <Container size="sm" style={{ paddingBlock: "20vh" }}>
        <Heading as="h1" size="3xl" display>
          Make
        </Heading>
        <Text tone="muted" style={{ marginTop: "1rem" }}>
          A showcase of things I build. Coming soon.
        </Text>
      </Container>
    </main>
  );
}
