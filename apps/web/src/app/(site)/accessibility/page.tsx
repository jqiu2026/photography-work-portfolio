import type { Metadata } from "next";
import { LegalOrBuiltin, LegalPage } from "@/components/site/LegalPage";
import { person } from "@/content/site";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Accessibility statement and how to report a problem.",
};

// TODO(owner): review; update the known issues list after each audit.
function Builtin() {
  return (
    <LegalPage title="Accessibility" updated="October 2026">
      <p>I want everyone to be able to use these sites. The goal is conformance with WCAG 2.2 level AA.</p>
      <h2 id="what">What is in place</h2>
      <ul>
        <li>Everything works with a keyboard, with visible focus, and a "skip to content" link.</li>
        <li>Text and controls meet AA colour contrast in light and dark themes.</li>
        <li>Photographs have text descriptions. Decorative images are hidden from screen readers.</li>
        <li>If your device asks for reduced motion, animations are replaced with a calm, static layout.</li>
        <li>Videos and music do not play or load until you press play.</li>
      </ul>
      <h2 id="known">Known gaps</h2>
      <ul>
        <li>Some older photograph descriptions are short. I am improving them.</li>
        <li>Videos on a few posts have no captions yet.</li>
      </ul>
      <h2 id="feedback">Tell me about a problem</h2>
      <p>
        If something is hard to use, email <a href={`mailto:${person.email}`}>{person.email}</a> and I will try to fix
        it or find another way to give you the information.
      </p>
    </LegalPage>
  );
}

export default function Accessibility() {
  return <LegalOrBuiltin slug="accessibility" fallback={<Builtin />} />;
}
