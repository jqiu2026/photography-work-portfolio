import { Code } from "@/lib/Code";

export const metadata = { title: "Getting started" };

export default function Page() {
  return (
    <article className="docs-prose">
      <h1>Getting started</h1>
      <p>In this repository the package is a workspace dependency; elsewhere, install it. Import the stylesheet once, then wrap the app in <code>Theme</code>.</p>
      <Code language="bash" code={"pnpm add @holominimal/ui"} />
      <Code
        language="tsx"
        code={`import "@holominimal/ui/styles.css";\nimport { Theme, Button } from "@holominimal/ui";\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>\n        <Theme theme={{ accent: "violet" }}>{children}</Theme>\n      </body>\n    </html>\n  );\n}`}
      />
      <p>Render router links with <code>asChild</code> (on <code>Button</code>, <code>DockItem</code>, <code>DialogTrigger</code> and others); the library never imports a router.</p>
    </article>
  );
}
