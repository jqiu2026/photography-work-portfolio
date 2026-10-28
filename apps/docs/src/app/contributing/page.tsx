import { Code } from "@/lib/Code";

export const metadata = { title: "Contributing" };

export default function Page() {
  return (
    <article className="docs-prose">
      <h1>Contributing</h1>
      <Code language="bash" code={"pnpm install\npnpm --filter @jerryqiu/docs dev\npnpm lint && pnpm typecheck && pnpm test"} />
      <p>Document a component in <code>apps/docs/src/content/components.ts</code> and give it a live demo in <code>src/components/Demos.tsx</code>; a test fails if a documented name is not a real export, or a live entry has no demo.</p>
    </article>
  );
}
