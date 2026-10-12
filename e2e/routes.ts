export const hub = "http://localhost:4000";
export const photos = "http://localhost:4002";
export const docs = "http://localhost:4001";

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
  ...["/music", "/music/listen", "/music/performances", "/music/about"].map((path) => ({
    site: "music",
    path,
    base: hub,
  })),
  ...["/flying", "/flying/log", "/flying/aircraft", "/flying/about"].map((path) => ({
    site: "flying",
    path,
    base: hub,
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
