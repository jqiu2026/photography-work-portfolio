import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui";
import { Player } from "@/components/Player";
import { getMusicContent } from "@/lib/interests";

export const metadata: Metadata = { title: "Listen", description: "Recordings by Jerry Qiu." };

export default async function Listen() {
  const { recordings } = await getMusicContent();
  return (
    <main id="main">
      <PageHeader eyebrow="Music" title="Listen" intro="Recordings load only when you press play." />
      <div className="mu-wrap mu-section mu-stack">
        {recordings.length ? null : <EmptyState>Recordings will be added here.</EmptyState>}
        {recordings.map((r) => (
          <Player
            key={`${r.provider}-${r.id}`}
            provider={r.provider}
            id={r.id}
            title={r.title}
            note={[r.date, r.note].filter(Boolean).join(" · ") || undefined}
          />
        ))}
      </div>
    </main>
  );
}
