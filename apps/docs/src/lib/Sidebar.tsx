import { Dock, DockItem } from "@holominimal/ui";
import { docs } from "@/content/components";

const start = [
  ["Overview", "/"],
  ["Getting started", "/getting-started"],
  ["Theming", "/theming"],
  ["Motion", "/motion"],
  ["Accessibility", "/accessibility"],
  ["Components", "/components"],
  ["Changelog", "/changelog"],
  ["Contributing", "/contributing"],
] as const;

/** The docs' navigation: the guides, then the components page (each component is listed there). */
export function Sidebar() {
  return (
    <Dock aria-label="Docs">
      {start.map(([label, href]) => (
        <DockItem key={href} asChild>
          <a href={href}>{href === "/components" ? `${label} (${docs.length})` : label}</a>
        </DockItem>
      ))}
    </Dock>
  );
}
