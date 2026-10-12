import type { ReactNode } from "react";

const nav = [
  { title: "Start", items: [["Overview", "/"], ["Getting started", "/getting-started"], ["Theming", "/theming"]] },
  { title: "Components", items: [["All components", "/components"]] },
];

export function Sidebar({ toggle }: { toggle: ReactNode }) {
  return (
    <aside className="docs-side">
      <div className="docs-side__top"><a href="/" className="docs-brand">PlaceholderUI</a>{toggle}</div>
      <nav aria-label="Docs">
        {nav.map((g) => (
          <div key={g.title}>
            <p className="ph-eyebrow">{g.title}</p>
            <ul>{g.items.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
