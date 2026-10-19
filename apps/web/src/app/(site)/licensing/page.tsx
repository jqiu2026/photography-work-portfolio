import type { Metadata } from "next";
import { LegalOrBuiltin, LegalPage } from "@/components/site/LegalPage";
import { person } from "@/content/site";

export const metadata: Metadata = {
  title: "Copyright and licensing",
  description: "How to use, license or request removal of my photographs and writing.",
};

// TODO(owner): have a lawyer review this text.
function Builtin() {
  return (
    <LegalPage title="Copyright and licensing" updated="October 2026">
      <p>
        Unless a page states otherwise, every photograph, video and piece of writing on these sites is © {person.name}.
        All rights reserved. Please do not copy, republish, edit or use them without permission.
      </p>
      <h2 id="license">Asking for a licence</h2>
      <p>
        I am happy to license images for editorial, personal and some commercial uses. Email{" "}
        <a href={`mailto:${person.bookingEmail}`}>{person.bookingEmail}</a> with the image, where it will appear, for
        how long, and your name or organization.
      </p>
      <h2 id="takedown">Misuse and removal</h2>
      <p>
        If you find one of my images used without permission, or you are in a photograph and want it removed, email{" "}
        <a href={`mailto:${person.email}`}>{person.email}</a> with the page address. I aim to reply within a few days.
      </p>
      <h2 id="ai">AI and scraping</h2>
      <p>
        I do not give permission to use my work to train machine-learning models. The site asks well-behaved crawlers to
        stay out (robots.txt and <code>noai</code> tags). That is a request, not a technical guarantee, and I cannot
        promise it will be followed.
      </p>
      <h2 id="protection">Image protection</h2>
      <p>
        Right-clicking and saving may be discouraged on some pages. This only deters casual copying; it cannot stop
        screenshots or photographs of a screen, and I will not pretend otherwise.
      </p>
      <h2 id="credits">Third-party material</h2>
      <p>
        Fonts are used under the SIL Open Font License. Open-source software used to build the sites is listed in the
        third-party licences file in the project repository.
      </p>
    </LegalPage>
  );
}

export default function Licensing() {
  return <LegalOrBuiltin slug="licensing" fallback={<Builtin />} />;
}
