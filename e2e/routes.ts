export const hub = "http://localhost:4000";
export const photos = "http://localhost:4002";
export const docs = "http://localhost:4001";
export const music = "http://localhost:4003";
export const flying = "http://localhost:4004";

/** Every public route of every site. */
export const routes: { site: string; path: string; base: string }[] = [
  ...[
    "/",
    "/about",
    "/writing",
    "/writing/day-one",
    "/writing/positivity-at-stuy",
    "/connect",
    "/privacy",
    "/terms",
    "/licensing",
    "/accessibility",
    "/nope",
  ].map((path) => ({ site: "hub", path, base: hub })),
  ...["/", "/listen", "/performances", "/about"].map((path) => ({
    site: "music",
    path,
    base: music,
  })),
  ...["/", "/log", "/aircraft", "/about"].map((path) => ({
    site: "flying",
    path,
    base: flying,
  })),
  ...[
    "/",
    "/portfolio",
    "/portfolio/theater",
    "/work",
    "/work/stuy-sing-26",
    "/work/stuypa-cny-dinner-26",
    "/work/stuy-open-house-march-26",
    "/video",
    "/about",
    "/book",
    "/privacy",
    "/client",
    "/nope",
  ].map((path) => ({
    site: "photos",
    path,
    base: photos,
  })),
  ...["/", "/getting-started", "/theming", "/components"].map((path) => ({ site: "docs", path, base: docs })),
];
