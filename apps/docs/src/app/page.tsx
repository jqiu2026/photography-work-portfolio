export default function Home() {
  return (
    <article className="docs-prose">
      <h1>Holominimal</h1>
      <p>
        Holominimal (holographic and minimal) is the design system every site here is built on: near-black surfaces
        separated by hairlines, white type with gray secondary text, restrained cyan, blue, violet and magenta light, and
        motion that explains rather than decorates.
      </p>
      <ul>
        <li>React 19 components with typed props and no runtime dependencies.</li>
        <li>One stylesheet with CSS custom properties (<code>--hm-*</code>); theme any subtree.</li>
        <li>Server-compatible components carry no <code>"use client"</code>; interactive ones keep it per file.</li>
        <li>Reduced motion is respected everywhere and can be forced per theme.</li>
      </ul>
      <p>
        <a href="/getting-started">Getting started</a> · <a href="/theming">Theming</a> ·{" "}
        <a href="/components">Components</a>
      </p>
    </article>
  );
}
