import type { GalleryImage } from "@placeholder/ui/media";
import * as repo from "@/content/portfolio";
import { getGalleries } from "@/lib/content-db";

export type Category = { slug: string; name: string };
export type Photo = GalleryImage & { id: string; category: string };
export type Portfolio = {
  categories: Category[];
  photos: Photo[];
  photosIn(slug: string): Photo[];
  featured: Photo[];
  hero: Photo | undefined;
  compare: Photo[];
};

function build(categories: Category[], photos: Photo[], featured?: Photo[]): Portfolio {
  const photosIn = (slug: string) => photos.filter((p) => p.category === slug);
  const present = categories.filter((c) => photosIn(c.slug).length);
  // Featured: the first photograph of each subject in turn, so the home page shows range.
  const pick =
    featured ??
    (() => {
      const out: Photo[] = [];
      for (let round = 0; out.length < 9 && round < 3; round++)
        for (const c of present) {
          const p = photosIn(c.slug)[round];
          if (p && out.length < 9) out.push(p);
        }
      return out;
    })();
  return {
    categories,
    photos,
    photosIn,
    featured: pick,
    hero: photosIn("portrait")[0] ?? photos[0],
    compare: pick.slice(0, 3),
  };
}

/** The portfolio from the CMS galleries (one gallery per subject), or the shipped static set without a database. */
export async function getPortfolio(): Promise<Portfolio> {
  const galleries = await getGalleries();
  if (!galleries) {
    const byId = (id: string) => repo.photos.find((p) => p.id === id) as Photo;
    return {
      ...build(repo.categories, repo.photos as Photo[], repo.featured as Photo[]),
      hero: byId("gf4a9402-2-3"),
      compare: ["jry1082", "2026-01-17-snow-7", "jry0473"].map(byId),
    };
  }
  const categories = galleries.map((g) => ({ slug: g.slug, name: g.title }));
  const photos = galleries.flatMap((g) =>
    g.items.map(
      (it, i): Photo => ({
        ...it.asset,
        id: it.asset.id,
        category: g.slug,
        alt: it.asset.alt || `${g.title} photograph ${i + 1}`,
      }),
    ),
  );
  return build(categories, photos);
}
