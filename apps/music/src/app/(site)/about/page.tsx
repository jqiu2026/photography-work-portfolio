import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getMusicContent } from "@/lib/interests";

export const metadata: Metadata = { title: "About", description: "About Jerry Qiu, musician." };

export default async function About() {
  const music = await getMusicContent();
  return (
    <main id="main">
      <PageHeader eyebrow="Music" title="About" />
      <div className="mu-wrap mu-section">
        <div className="hm-prose mu-voice">
          {music.story ? music.story.split(/\n{2,}/).map((p) => <p key={p}>{p}</p>) : null}
          {music.instruments.length ? <p>Instruments: {music.instruments.join(", ")}.</p> : null}
          {music.repertoire.length ? <p>Repertoire: {music.repertoire.join(", ")}.</p> : null}
        </div>
      </div>
    </main>
  );
}
