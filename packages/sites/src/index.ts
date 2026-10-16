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
  /** The site's accent colour (a dash of colour in the switcher and footer). */
  color: "blue" | "red" | "green" | "yellow";
};

const isProd = process.env.NODE_ENV === "production";

function origin(envValue: string | undefined, dev: string, prod: string) {
  return (envValue || (isProd ? prod : dev)).replace(/\/$/, "");
}

export function getSites(): SiteInfo[] {
  const hub = origin(process.env.NEXT_PUBLIC_HUB_URL, "http://localhost:3000", "https://jerryqiu.com");
  return [
    {
      id: "hub",
      name: "Jerry Qiu",
      description: "About me, my work and writing",
      preset: "hub",
      color: "blue",
      url: hub,
    },
    {
      id: "photos",
      name: "Photography",
      description: "Portfolio and galleries",
      preset: "photos",
      color: "red",
      url: origin(process.env.NEXT_PUBLIC_PHOTOS_URL, "http://localhost:3002", "https://photo.jerryqiu.com"),
    },
    {
      id: "music",
      name: "Music",
      description: "What I play and where to hear it",
      preset: "music",
      color: "yellow",
      url: origin(process.env.NEXT_PUBLIC_MUSIC_URL, "http://localhost:3003", "https://music.jerryqiu.com"),
    },
    {
      id: "flying",
      name: "Flying",
      description: "Notes and photos about flying",
      preset: "flying",
      color: "green",
      url: origin(process.env.NEXT_PUBLIC_FLYING_URL, "http://localhost:3004", "https://flying.jerryqiu.com"),
    },
  ];
}

export function getSite(id: SiteId): SiteInfo {
  const site = getSites().find((s) => s.id === id);
  if (!site) throw new Error(`Unknown site: ${id}`);
  return site;
}

/**
 * Link path for a page of a site. Every site has its own origin (and its own deployment), so paths are always
 * root-relative within that site.
 */
export function sitePath(_id: SiteId, path = "/"): string {
  return path === "" ? "/" : path;
}
