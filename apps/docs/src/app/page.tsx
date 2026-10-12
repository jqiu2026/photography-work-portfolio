import { Prose } from "@halation/ui";

export default function Home() {
  return (
    <Prose>
      <h1>Halation</h1>
      <p>A small, calm React UI kit: quiet components, one signature easing curve, and an optional Apple-style motion layer (scroll scenes, parallax, reveals) that always degrades to a complete static page.</p>
      <p>The name is a placeholder. It lives in one config file and a rename script changes it everywhere.</p>
      <ul>
        <li><a href="/getting-started">Getting started</a></li>
        <li><a href="/theming">Theming</a></li>
        <li><a href="/components">Components</a></li>
      </ul>
    </Prose>
  );
}
