import { Prose } from "@placeholder/ui";

export const metadata = { title: "Accessibility guide" };

export default function Page() {
  return (
    <Prose>
      <h1>Accessibility guide</h1>
      <p>The target is WCAG 2.2 AA. It is a release gate: the end-to-end suite runs axe on every page in light and dark at 390px and 1440px.</p>
      <ul>
        <li><strong>Contrast.</strong> Text tokens meet AA on every theme. Accent fills are paired with an AA text colour (<code>--ph-accent-text</code>).</li>
        <li><strong>Keyboard.</strong> Every control is a native element or a Radix primitive, with a visible focus ring and 44px targets.</li>
        <li><strong>Names.</strong> Icon-only controls require a label. Images require <code>alt</code> (<code>""</code> when decorative).</li>
        <li><strong>Motion.</strong> Reduced motion gives a complete static page; nothing essential lives in animation.</li>
        <li><strong>Third parties.</strong> Embeds load only after a click.</li>
      </ul>
    </Prose>
  );
}
