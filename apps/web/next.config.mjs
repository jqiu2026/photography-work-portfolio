/** @type {import('next').NextConfig} */
const photos = () =>
  (
    process.env.NEXT_PUBLIC_PHOTOS_URL ||
    (process.env.NODE_ENV === "production" ? "https://photos.jerryqiu.com" : "http://localhost:3002")
  ).replace(/\/$/, "");

export default {
  // A second dev server (the admin e2e suite) needs its own build directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: [
    "@halation/ui",
    "@jerryqiu/sites",
    "@jerryqiu/render",
    "@jerryqiu/mocks",
    "@jerryqiu/auth",
    "@jerryqiu/db",
    "@jerryqiu/protect",
    "@jerryqiu/storage",
    "@jerryqiu/inbox",
    "@jerryqiu/media",
  ],
  // PGlite and sharp are native/WASM packages that must not be bundled.
  serverExternalPackages: ["sharp", "pg", "@electric-sql/pglite"],
  async redirects() {
    return [
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/:slug", destination: "/writing/:slug", permanent: true },
      { source: "/contact", destination: "/connect", permanent: true },
      // Project case studies moved to the photography site (R1). 301 on purpose: the move is permanent.
      { source: "/work", destination: `${photos()}/work`, statusCode: 301 },
      { source: "/work/:slug", destination: `${photos()}/work/:slug`, statusCode: 301 },
      { source: "/gallery", destination: `${photos()}/`, permanent: false },
      { source: "/api/rss", destination: "/writing/rss.xml", permanent: true },
    ];
  },
};
