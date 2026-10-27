import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui";
import { getImage, srcSet } from "@/lib/images";
import { getFlyingContent } from "@/lib/interests";

export const metadata: Metadata = { title: "Aircraft" };

export default async function Aircraft() {
  const flying = await getFlyingContent();
  const photos = flying.photographed.map((id, i) => ({
    ...getImage("gallery", id),
    alt: `Airliner photograph ${i + 1}`,
  }));
  return (
    <div>
      <PageHeader eyebrow="Flying" title="Aircraft" />
      <div className="fl-wrap fl-section fl-stack">
        <section aria-labelledby="flown" className="fl-stack">
          <h2 id="flown" className="fl-h2">
            Flown
          </h2>
          {flying.aircraftFlown.length ? (
            <ul className="fl-list">
              {flying.aircraftFlown.map((a) => (
                <li key={a.name}>
                  <span>{a.name}</span>
                  {a.note ? <span className="fl-muted">{a.note}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No aircraft listed yet.</EmptyState>
          )}
        </section>
        <section aria-labelledby="ph" className="fl-stack">
          <h2 id="ph" className="fl-h2">
            Photographed
          </h2>
          <div className="fl-cards">
            {photos.map((p) => (
              <figure key={p.files[0].src} className="fl-shot">
                <img
                  src={p.files[1]?.src ?? p.files[0].src}
                  srcSet={srcSet(p)}
                  sizes="(min-width: 900px) 30vw, 100vw"
                  width={p.width}
                  height={p.height}
                  alt={p.alt}
                  loading="lazy"
                  style={{ backgroundColor: p.color }}
                />
              </figure>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
