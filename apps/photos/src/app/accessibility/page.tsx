import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import { Page } from "@/components/Marketing";

export const metadata: Metadata = { title: "Accessibility", description: "Our accessibility statement." };

export default function Accessibility() {
  return (
    <Page title="Accessibility" lede="This site aims for WCAG 2.2 level AA.">
      {/* TODO(owner, lawyer): review this statement. */}
      <p>
        We test with automated checks (axe) on every public page in light and dark themes, at phone and desktop widths,
        and we use the keyboard, visible focus, labelled controls, 44 px targets and AA contrast as acceptance criteria.
        Motion is minimal and respects the reduced-motion setting. Every photograph has alt text.
      </p>
      <p>
        <strong>Known limits.</strong> Protected photographs load through a script, so they do not appear without
        JavaScript (the text and alt descriptions still do). Some alt texts are still generic descriptions and are being
        replaced with real ones. Automated checks do not catch everything.
      </p>
      <p>
        If something is hard to use, tell me: <a href={`mailto:${person.bookingEmail}`}>{person.bookingEmail}</a>.
      </p>
    </Page>
  );
}
