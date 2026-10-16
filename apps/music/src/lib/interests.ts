import { music as repoMusic } from "@/content/interests";
import type { Performance, Recording } from "@/content/interests";
import { getMusic, getSiteSettings } from "@/lib/content-db";
import { siteSettings } from "@/lib/site-settings";

const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const arr = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];

/** Music page content in the shape the pages already use: CMS values win, repository text is the fallback. */
export async function getMusicContent() {
  const [items, raw, site] = await Promise.all([getMusic(), getSiteSettings("music"), siteSettings("music")]);
  if (!items && !raw) return repoMusic;
  const bg = (raw?.background ?? {}) as Record<string, unknown>;
  const list = items ?? [];
  return {
    intro: s(site.home.heroIntro) ?? repoMusic.intro,
    instruments: arr(bg.instruments),
    story: s(bg.story) ?? repoMusic.story,
    repertoire: arr(bg.repertoire),
    recordings: list
      .filter((m) => m.kind === "recording" && m.provider && m.embedId)
      .map(
        (m): Recording => ({
          title: m.title,
          provider: m.provider as Recording["provider"],
          id: m.embedId as string,
          note: m.note ?? undefined,
          date: m.date ?? undefined,
          rights: m.rights as Recording["rights"],
        }),
      ),
    performances: list
      .filter((m) => m.kind === "performance")
      .map(
        (m): Performance => ({
          title: m.title,
          date: m.date ?? "",
          venue: m.venue ?? undefined,
          ensemble: m.ensemble ?? undefined,
          note: m.note ?? undefined,
        }),
      ),
  };
}
