import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui";
import { getMusicContent } from "@/lib/interests";

export const metadata: Metadata = { title: "Performances", description: "Where Jerry Qiu has played." };

export default async function Performances() {
  const { performances } = await getMusicContent();
  return (
    <main id="main">
      <PageHeader eyebrow="Music" title="Performances" />
      <div className="mu-wrap mu-section">
        {performances.length ? (
          <ul className="mu-list">
            {performances.map((p) => (
              <li key={`${p.title}-${p.date}`}>
                <span>
                  {p.title}
                  {p.ensemble ? <span className="mu-muted">, {p.ensemble}</span> : null}
                </span>
                <span className="mu-muted">{[p.date, p.venue].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Performances will be listed here.</EmptyState>
        )}
      </div>
    </main>
  );
}
