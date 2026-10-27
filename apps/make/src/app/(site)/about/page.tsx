import { PLACES } from "@jerryqiu/db/make";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "About", description: "About this site." };

export default function About() {
  return (
    <div>
      <PageHeader eyebrow="Make" title="About this site" />
      <div className="mk-wrap mk-section">
        {/* TODO(owner): say who you are in your own words; nothing about you is claimed here. */}
        <div className="hm-prose">
          <p>
            This is a small, curated showcase of things I build. It holds a handful of projects on purpose, each with a
            write-up of how it works and what I learned.
          </p>
          <h2>The workshop words</h2>
          <p>The names are a bit of fun. Each one always comes with its plain meaning:</p>
          <ul>
            {Object.values(PLACES).map((p) => (
              <li key={p.word}>
                <strong>{p.word}</strong>: {p.plain}.
              </li>
            ))}
            <li>
              <strong>Tool wall</strong>: the tools used across the projects.
            </li>
          </ul>
          <h2>Screenshots</h2>
          <p>
            Every screenshot is looked at before it is shown, to make sure it contains no secrets, keys or other
            people's data, and is re-saved without hidden metadata.
          </p>
        </div>
      </div>
    </div>
  );
}
