import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { person } from "@/content/site";

export const metadata: Metadata = { title: "Terms", description: "Terms of use for this site." };

// TODO(owner): have a lawyer review this text. Governing law and jurisdiction are placeholders.
export default function Terms() {
  return (
    <LegalPage title="Terms of use" updated="October 2026">
      <p>By using this site you agree to these terms. If you do not agree, please do not use it.</p>
      <h2 id="use">Using the site</h2>
      <p>
        You may browse, read and link to this site for personal, non-commercial purposes. Please do not try to disrupt
        it, scrape it at scale, or use it to harass anyone.
      </p>
      <h2 id="ip">Photographs and writing</h2>
      <p>
        All photographs, video and writing are © {person.name} and all rights are reserved unless a page says otherwise.
        Copying, republishing or using them to train machine-learning systems requires written permission. See{" "}
        <a href="/licensing">Copyright and licensing</a>.
      </p>
      <h2 id="people">People in photographs</h2>
      <p>
        If you appear in a photograph and would like it removed or credited differently, email{" "}
        <a href={`mailto:${person.email}`}>{person.email}</a>. I will respond promptly.
      </p>
      <h2 id="links">Links and embeds</h2>
      <p>
        This site links to other websites and embeds some third-party players. I am not responsible for their content or
        practices.
      </p>
      <h2 id="warranty">No warranty</h2>
      <p>
        The site is provided as is. Nothing here is professional advice; in particular, flying content is personal
        experience and not flight instruction or aviation advice.
      </p>
      <h2 id="law">Governing law</h2>
      <p>[Governing law and jurisdiction to be added.]</p>
    </LegalPage>
  );
}
