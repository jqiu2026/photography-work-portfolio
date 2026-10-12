import { readSetting } from "@jerryqiu/db/settings";
import { getSiteSettings } from "@/lib/content-db";

/** Validated settings for the photography site (defaults when nothing is stored or there is no database). */
export async function photosSettings() {
  const raw = (await getSiteSettings()) ?? {};
  return {
    general: readSetting("general", raw.general),
    seo: readSetting("seo", raw.seo),
    protection: readSetting("protection", raw.protection),
  };
}
