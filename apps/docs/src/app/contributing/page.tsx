import { CodeBlock, Prose } from "@halation/ui";

export const metadata = { title: "Contributing" };

export default function Page() {
  return (
    <Prose>
      <h1>Contributing</h1>
      <CodeBlock language="bash" code={"pnpm install\npnpm --filter @halation/ui test\npnpm lint && pnpm typecheck && pnpm build"} />
      <p>Add a component to <code>packages/ui</code>, document it in <code>apps/docs/src/content/components.ts</code> (a test fails if an export has no docs page), add unit tests that check behaviour (not only rendering), and add a changeset with <code>pnpm changeset</code>.</p>
    </Prose>
  );
}
