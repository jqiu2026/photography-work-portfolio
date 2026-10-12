import { Button, Container, Text } from "@halation/ui";
import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell>
      <Container size="sm" style={{ paddingBlock: "8rem" }}>
        <h1 className="hl-heading hl-heading--display">Not found</h1>
        <Text tone="muted" style={{ margin: "1.25rem 0 2rem" }}>
          That page doesn't exist, or it moved.
        </Text>
        <Button as={Link} href="/">
          Back to the portfolio
        </Button>
      </Container>
    </Shell>
  );
}
