import { Demo } from "@/components/Demos";
import { Code } from "@/lib/Code";

export const metadata = { title: "Motion" };

export default function Page() {
  return (
    <article className="docs-prose">
      <h1>Motion</h1>
      <p>Motion is a layer over a complete, still page. Use it for two or three moments a page, never for everything, and never as the only way to learn something.</p>
      <ul>
        <li>Shared curves and durations (<code>--hm-ease-glide</code>, <code>--hm-dur-*</code>); no per-component curves.</li>
        <li><code>Animate</code> plays named presets (<code>fade-up</code>, <code>zoom-in</code>, <code>pop</code> …) on mount, in view, on hover or on click.</li>
        <li>Everything renders a complete still state under reduced motion.</li>
      </ul>
      <Demo name="Animate" />
      <Code language="tsx" code={`<Animate animation="fade-up" trigger="view">…</Animate>`} />
      <h2 id="text">Text in motion</h2>
      <Demo name="Typewriter" />
      <Demo name="CountUp" />
    </article>
  );
}
