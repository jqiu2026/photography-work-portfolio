import { day } from "@/lib/day";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui";
import { getNow } from "@/lib/data";

export const metadata: Metadata = { title: "Now", description: "What I'm working on this week." };

export default async function Now() {
  const now = await getNow();
  return (
    <div>
      <PageHeader eyebrow="Make" title="Now" intro="A short running log of what I'm working on. Newest first." />
      <div className="mk-wrap mk-section">
        {now.length ? (
          <ul className="mk-list">
            {now.map((n) => (
              <li key={n.id}>
                <span>{n.body}</span>
                <span className="mk-mono">{day(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Nothing logged yet.</EmptyState>
        )}
      </div>
    </div>
  );
}
