import { flying as repoFlying } from "@/content/interests";
import { getFlying, getSiteSettings } from "@/lib/content-db";
import { siteSettings } from "@/lib/site-settings";

const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const arr = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];

/** Flying page content: only entries that passed the safe-to-publish checklist ever reach this (enforced in the query). */
export async function getFlyingContent() {
  const [data, raw, site] = await Promise.all([getFlying(), getSiteSettings("flying"), siteSettings("flying")]);
  if (!data && !raw) return repoFlying;
  const bg = (raw?.background ?? {}) as Record<string, unknown>;
  const certs = (s(bg.certificates) ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, ...rest] = l.split("|");
      return { title: title.trim(), note: rest.join("|").trim() };
    });
  return {
    intro: s(site.home.heroIntro) ?? repoFlying.intro,
    story: s(bg.story) ?? repoFlying.story,
    certificates: certs.length ? certs : repoFlying.certificates,
    club: s(bg.clubName)
      ? { name: s(bg.clubName) as string, note: s(bg.clubNote) ?? "", href: s(bg.clubUrl) ?? repoFlying.club.href }
      : repoFlying.club,
    aircraftFlown: (data?.aircraft ?? [])
      .filter((a) => a.flown)
      .map((a) => ({ name: a.name, note: a.note ?? undefined })),
    log: (data?.entries ?? []).map((e) => ({
      title: e.title,
      date: e.date ?? "",
      note: e.story ?? undefined,
      safeToPublish: true,
    })),
    photographed: repoFlying.photographed,
    disclaimer: repoFlying.disclaimer,
  };
}
