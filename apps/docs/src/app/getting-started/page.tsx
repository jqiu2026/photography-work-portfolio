import { CodeBlock, Prose } from "@halation/ui";

export const metadata = { title: "Getting started" };

export default function Page() {
  return (
    <Prose>
      <h1>Getting started</h1>
      <p>Install the package, import the stylesheet once, and wrap your app in the theme provider. No Tailwind is required: styles are plain CSS with <code>--hl-*</code> variables.</p>
      <CodeBlock language="bash" code="pnpm add @halation/ui" />
      <CodeBlock language="tsx" code={`import "@halation/ui/styles.css";\nimport { ThemeProvider, ThemeScript, Button } from "@halation/ui";\n\n<html lang="en" suppressHydrationWarning>\n  <head><ThemeScript preset="hub" /></head>\n  <body className="hl-root">\n    <ThemeProvider preset="hub"><Button>Hello</Button></ThemeProvider>\n  </body>\n</html>`} />
      <p>Fonts are provided by your app: set <code>--font-sans</code> and <code>--font-mono</code> (for example with <code>next/font</code>). Without them the kit falls back to system fonts.</p>
    </Prose>
  );
}
