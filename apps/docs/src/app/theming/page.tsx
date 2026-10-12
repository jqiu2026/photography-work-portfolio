import { CodeBlock, Prose } from "@halation/ui";

export const metadata = { title: "Theming" };

export default function Page() {
  return (
    <Prose>
      <h1>Theming</h1>
      <p>Everything is a CSS variable. Light and dark switch on <code>[data-theme]</code>; the colour and shape identity switches on <code>[data-preset]</code> (<code>hub</code>, <code>photos</code>, <code>music</code>, <code>flying</code>). <code>ThemeScript</code> sets both before first paint so there is no flash.</p>
      <CodeBlock language="css" code={`[data-preset="brand"][data-theme="light"] {\n  --hl-bg: #fff; --hl-text: #111; --hl-accent: #0a5;\n  --hl-radius-control: 8px;\n}`} />
      <p>Motion tokens (<code>--hl-ease</code>, <code>--hl-dur-*</code>) collapse to near zero under <code>prefers-reduced-motion</code>.</p>
    </Prose>
  );
}
