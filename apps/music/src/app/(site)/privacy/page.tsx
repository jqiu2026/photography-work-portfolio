import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <main id="main">
      <PageHeader eyebrow="Legal" title="Privacy" intro="What this site keeps, and why." />
      <div className="mu-wrap mu-section">
        {/* TODO(owner): draft text; lawyer review (Q13). */}
        <div className="hm-prose">
          <h2>When you buy a score</h2>
          <p>
            Your name and email are kept with the order, to deliver the score, send the receipt, and put your name on
            your copy. Card details go to Stripe and never reach this site. Orders are kept for tax and support.
          </p>
          <h2>When you sign up for the newsletter</h2>
          <p>
            Your email is kept until you unsubscribe. You confirm by link first. Every email has an unsubscribe link.
          </p>
          <h2>When you ask about a commission</h2>
          <p>Your message and email are kept so I can reply, and deleted on request.</p>
          <h2>Recordings</h2>
          <p>
            A recording loads from its provider (YouTube, SoundCloud, Spotify or Bandcamp) only when you press play.
            Until then nothing is requested from them.
          </p>
          <h2>Your data</h2>
          <p>Write to ask what is kept about you, or to have it deleted.</p>
        </div>
      </div>
    </main>
  );
}
