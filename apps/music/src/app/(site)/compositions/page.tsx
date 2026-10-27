import type { Metadata } from "next";
import { CatalogFilters } from "@/components/CatalogFilters";
import { PageHeader } from "@/components/PageHeader";
import { PieceCard } from "@/components/PieceCard";
import { EmptyState } from "@/components/ui";
import { getCatalog } from "@/lib/data";
import { catalogFacets } from "@jerryqiu/db/music";

export const metadata: Metadata = {
  title: "Compositions",
  description: "Pieces by Jerry Qiu: filter by instrument, style and difficulty, listen, and get the score.",
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Compositions({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const current = {
    q: first(sp.q),
    instrument: first(sp.instrument),
    genre: first(sp.genre),
    difficulty: first(sp.difficulty),
    sale: first(sp.sale),
    listen: first(sp.listen),
  };
  const [all, shown] = await Promise.all([
    getCatalog("{}"),
    getCatalog(
      JSON.stringify({
        q: current.q?.slice(0, 80),
        instrument: current.instrument,
        genre: current.genre,
        difficulty: current.difficulty,
        forSale: current.sale === "1",
        listenable: current.listen === "1",
      }),
    ),
  ]);
  return (
    <main id="main">
      <PageHeader
        eyebrow="Music"
        title="Compositions"
        intro="Everything I've published. The score and the recording are separate: some pieces have one, some both."
      />
      <div className="mu-wrap mu-section">
        <CatalogFilters facets={catalogFacets(all)} current={current} basePath="/compositions" />
        <p className="mu-muted" role="status" aria-live="polite">
          {shown.length} {shown.length === 1 ? "piece" : "pieces"}
        </p>
        {shown.length ? (
          <div className="mu-grid">
            {shown.map((c) => (
              <PieceCard key={c.id} e={c} />
            ))}
          </div>
        ) : (
          <EmptyState>
            {all.length ? "Nothing matches those filters." : "The catalog is being put together. Check back soon."}
          </EmptyState>
        )}
      </div>
    </main>
  );
}
