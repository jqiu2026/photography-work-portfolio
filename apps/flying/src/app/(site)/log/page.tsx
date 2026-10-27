import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui";
import { getPublicFlights } from "@/lib/data";
import { getFlyingContent } from "@/lib/interests";

export const metadata: Metadata = { title: "Log", description: "Milestones and memorable flights." };

export default async function Log() {
  const [flying, { flights }] = await Promise.all([getFlyingContent(), getPublicFlights()]);
  // Only entries marked safe to publish ever reach here (enforced in the query); flights are shown to the month and 7+ days late.
  const entries = flying.log.filter((e) => e.safeToPublish);
  return (
    <div>
      <PageHeader
        eyebrow="Flying"
        title="Log"
        intro="Milestones and memorable flights. Flights are shown by month, at airport level, a little after the fact on purpose."
      />
      <div className="fl-wrap fl-section fl-stack">
        {entries.length ? (
          <section aria-labelledby="ms" className="fl-stack">
            <h2 id="ms" className="fl-h2">
              Milestones
            </h2>
            <ul className="fl-list">
              {entries.map((e) => (
                <li key={`${e.title}-${e.date}`} style={{ display: "grid" }}>
                  <span className="fl-mono">{e.date}</span>
                  <strong>{e.title}</strong>
                  {e.note ? <span className="fl-muted">{e.note}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section aria-labelledby="fl" className="fl-stack">
          <h2 id="fl" className="fl-h2">
            Flights
          </h2>
          {flights.length ? (
            <ul className="fl-list">
              {flights.map((f) => (
                <li key={f.id}>
                  <span>
                    {f.from === f.to ? `Local flight from ${f.from}` : `${f.from} to ${f.to}`}
                    {f.aircraft ? `, ${f.aircraft}` : ""}
                    {f.note ? <span className="fl-muted"> · {f.note}</span> : null}
                  </span>
                  <span className="fl-mono">{f.month}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No flights published yet.</EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
