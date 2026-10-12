import type { ReactNode } from "react";
import { docs, groups } from "@/content/components";

const start = [["Overview", "/"], ["Getting started", "/getting-started"], ["Theming", "/theming"], ["Motion", "/motion"], ["Accessibility", "/accessibility"], ["Changelog", "/changelog"], ["Contributing", "/contributing"]];

export function Sidebar({ toggle }: { toggle: ReactNode }) {
  return (
    <aside className="docs-side">
      <div className="docs-side__top"><a href="/" className="docs-brand">PlaceholderUI</a>{toggle}</div>
      <nav aria-label="Docs">
        <div>
          <p className="ph-eyebrow">Start</p>
          <ul>{start.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
        </div>
        <div>
          <p className="ph-eyebrow">Components</p>
          <ul><li><a href="/components">All {docs.length}</a></li></ul>
        </div>
        {groups.map((g) => (
          <div key={g}>
            <p className="ph-eyebrow">{g}</p>
            <ul>{docs.filter((d) => d.group === g).map((d) => <li key={d.name}><a href={`/components/${d.name.toLowerCase()}`}>{d.name}</a></li>)}</ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
