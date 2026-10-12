import { Text } from "@halation/ui";

/** Shown in production where a section has no content yet (empty fields are hidden, never invented). */
export function Empty({ children = "Nothing here yet. Check back soon." }: { children?: string }) {
  return (
    <Text tone="muted" size="lg">
      {children}
    </Text>
  );
}
