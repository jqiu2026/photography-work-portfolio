import { intro, skills as repoSkills, timeline as repoTimeline } from "@/content/about";
import { person as repoPerson, socials as repoSocials } from "@/content/site";
import { getProfile } from "@/lib/content-db";

const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);
const strOrUndef = (v: unknown, fallback: string | undefined) =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;
const list = (v: unknown, fallback: string[]) =>
  Array.isArray(v) && v.length ? v.filter((x): x is string => typeof x === "string") : fallback;

const month = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
function period(t: { startDate: string | null; endDate: string | null; current: boolean }) {
  if (t.startDate && t.endDate) return `${month(t.startDate)} – ${month(t.endDate)}`;
  if (t.startDate) return `${month(t.startDate)} – ${t.current ? "present" : ""}`.trim();
  return t.endDate ? `Until ${month(t.endDate)}` : "";
}

/**
 * The owner's facts as the pages need them: edited values from the CMS win; anything left empty falls back to what ships
 * in the repository, so a half-filled profile never shows blanks.
 */
export async function getPerson() {
  const db = await getProfile();
  const p = db?.profile ?? {};
  const person = {
    ...repoPerson,
    name: str(p.name, repoPerson.name),
    headline: str(p.headline, repoPerson.headline),
    location: str(p.location, repoPerson.location),
    currently: strOrUndef(p.currently, repoPerson.currently),
    email: str(p.email, repoPerson.email),
    bookingEmail: str(p.bookingEmail, repoPerson.bookingEmail),
    languages: list(p.languages, repoPerson.languages),
  };
  const socials = db?.socials.length
    ? db.socials.map((s) => ({ label: s.label, href: s.href, icon: s.icon }))
    : repoSocials;
  const timeline = db?.timeline.length
    ? db.timeline.map((t) => ({
        title: t.title,
        org: t.org ?? undefined,
        period: period(t),
        summary: t.summary ?? "",
      }))
    : repoTimeline;
  const tags = list(p.skills, []);
  return { person, socials, timeline, skillTags: tags, skills: tags.length ? [] : repoSkills, intro };
}
