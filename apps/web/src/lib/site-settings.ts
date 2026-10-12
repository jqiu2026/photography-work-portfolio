import { getSiteSettings } from "@/lib/content-db";
import { readSetting } from "@/lib/settings";

type Site = "hub" | "photos" | "music" | "flying";

/** Validated settings for a site (defaults when nothing is stored or the database is unavailable). */
export async function siteSettings(site: Site) {
  const raw = (await getSiteSettings(site)) ?? {};
  return {
    general: readSetting("general", raw.general),
    home: readSetting("home", raw.home),
    seo: readSetting("seo", raw.seo),
    theme: readSetting("theme", raw.theme),
    protection: readSetting("protection", raw.protection),
    nav: readSetting("nav", raw.nav),
  };
}
