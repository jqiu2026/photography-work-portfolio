import type { Metadata } from "next";
import { LegalOrBuiltin, LegalPage } from "@/components/site/LegalPage";
import { person } from "@/content/site";

export const metadata: Metadata = { title: "Privacy", description: "What this site collects, and what it doesn't." };

// TODO(owner): have a lawyer review this text. Legal entity, postal address and governing law are placeholders.
function Builtin() {
  return (
    <LegalPage title="Privacy" updated="October 2026">
      <p>
        I try to collect as little as possible. This page explains what happens when you visit jerryqiu.com and the
        sites that share it (photos., music. and flying.).
      </p>
      <h2 id="what">What is collected</h2>
      <ul>
        <li>
          <strong>Server logs.</strong> Our host, Vercel, records standard request information (IP address, browser,
          pages requested) for security and reliability.
        </li>
        <li>
          <strong>Anonymous statistics.</strong> I use Vercel Analytics and Speed Insights. They do not use cookies and
          do not follow you across sites.
        </li>
        <li>
          <strong>Messages.</strong> If you send a message through the contact form, I store your name, email address
          and message so I can reply, and a one-way hash of your IP address to limit spam. I am emailed a copy. I keep a
          conversation as long as it is useful and delete it on request. If you email me directly, the same applies.
        </li>
        <li>
          <strong>Your settings.</strong> Your light or dark choice is saved in your browser (local storage), not sent
          to me.
        </li>
        <li>
          <strong>Password-protected pages.</strong> If you unlock one, a strictly necessary cookie lasts one hour.
        </li>
      </ul>
      <h2 id="embeds">Embedded videos and music</h2>
      <p>
        Videos and music players (YouTube, Spotify, SoundCloud, Bandcamp) do not load until you press play. When you do,
        that service may set its own cookies and applies its own privacy policy.
      </p>
      <h2 id="not">What is not collected</h2>
      <p>No advertising, no tracking pixels, no sale of data, and no accounts for visitors.</p>
      <h2 id="rights">Your choices</h2>
      <p>
        You can ask what I hold about you, ask me to correct or delete it, or ask me to stop contacting you. Email{" "}
        <a href={`mailto:${person.email}`}>{person.email}</a>. Depending on where you live you may have additional
        rights (for example under the GDPR or the CCPA), and I will honor them.
      </p>
      <h2 id="who">Who is responsible</h2>
      <p>{person.name}, New York. [Postal address and legal entity to be added.]</p>
      <h2 id="changes">Changes</h2>
      <p>
        If the site starts collecting anything new (for example a stored contact inbox), this page will be updated
        first.
      </p>
    </LegalPage>
  );
}

export default function Privacy() {
  return <LegalOrBuiltin slug="privacy" fallback={<Builtin />} />;
}
