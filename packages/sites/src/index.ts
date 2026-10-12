/**
 * Site registry: one place that knows every hostname in the family.
 * URLs come from env (NEXT_PUBLIC_*_URL) and default to localhost in dev
 * and the real subdomains in production. Nothing here touches DNS.
 */
export type SiteId = "hub" | "photos" | "music" | "flying";
export type Preset = SiteId;

export type SiteInfo = {
  id: SiteId;
  name: string;
  description: string;
  /** Absolute origin, no trailing slash. */
  url: string;
  /** Theme preset (see packages/ui themes.css). */
  preset: Preset;
  /** Path form that works in dev on the hub app (music/flying). */
  devPath?: string;
};

const isProd = process.env.NODE_ENV === "production";

function origin(envValue: string | undefined, dev: string, prod: string) {
  return (envValue || (isProd ? prod : dev)).replace(/\/$/, "");
}

export function getSites(): SiteInfo[] {
  const hub = origin(process.env.NEXT_PUBLIC_HUB_URL, "http://localhost:3000", "https://jerryqiu.com");
  return [
    { id: "hub", name: "Jerry Qiu", description: "About me, my work and writing", preset: "hub", url: hub },
    {
      id: "photos",
      name: "Photography",
      description: "Portfolio and galleries",
      preset: "photos",
      url: origin(process.env.NEXT_PUBLIC_PHOTOS_URL, "http://localhost:3002", "https://photos.jerryqiu.com"),
    },
    {
      id: "music",
      name: "Music",
      description: "What I play and where to hear it",
      preset: "music",
      url: origin(process.env.NEXT_PUBLIC_MUSIC_URL, `${hub}/music`, "https://music.jerryqiu.com"),
      devPath: "/music",
    },
    {
      id: "flying",
      name: "Flying",
      description: "Notes and photos about flying",
      preset: "flying",
      url: origin(process.env.NEXT_PUBLIC_FLYING_URL, `${hub}/flying`, "https://flying.jerryqiu.com"),
      devPath: "/flying",
    },
  ];
}

export function getSite(id: SiteId): SiteInfo {
  const site = getSites().find((s) => s.id === id);
  if (!site) throw new Error(`Unknown site: ${id}`);
  return site;
}

/**
 * Link path for a page of a site. On the hub app, music and flying live under /music and /flying in dev
 * (path mode); in production they are served from their own hostname (host mode) and paths are root-relative.
 */
export function sitePath(id: SiteId, path = "/"): string {
  const hostMode = process.env.NODE_ENV === "production" || !!process.env.NEXT_PUBLIC_HOST_MODE;
  const prefix = id === "music" || id === "flying" ? (hostMode ? "" : `/${id}`) : "";
  const p = path === "/" ? "" : path;
  return `${prefix}${p}` || "/";
}
