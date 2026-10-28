import { Code } from "@/lib/Code";

export const metadata = { title: "Theming" };

const swatches = ["--hm-bg", "--hm-surface", "--hm-surface-raised", "--hm-line-strong", "--hm-muted", "--hm-fg", "--hm-accent", "--hm-cyan", "--hm-blue", "--hm-violet", "--hm-magenta", "--hm-success", "--hm-warning", "--hm-danger"];

export default function Page() {
  return (
    <article className="docs-prose">
      <h1>Theming</h1>
      <p>Everything is a CSS custom property named <code>--hm-*</code>. <code>Theme</code> sets the accent hue, density and motion for its subtree; any token can be overridden in CSS.</p>
      <Code language="tsx" code={`<Theme theme={{ accent: "cyan", density: "compact", motion: "reduce" }}>…</Theme>`} />
      <Code language="css" code={`.my-panel {\n  --hm-accent-h: 200;\n  --hm-radius-md: 10px;\n}`} />
      <h2 id="tokens">Colour tokens</h2>
      <ul className="docs-swatches">
        {swatches.map((v) => (
          <li key={v}>
            <span style={{ background: `var(${v})` }} aria-hidden />
            <code>{v}</code>
          </li>
        ))}
      </ul>
      <p>Motion tokens (<code>--hm-ease-*</code>, <code>--hm-dur-*</code>) collapse under <code>prefers-reduced-motion</code>.</p>
    </article>
  );
}
