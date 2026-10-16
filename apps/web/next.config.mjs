/** @type {import('next').NextConfig} */
const photos = () =>
  (
    process.env.NEXT_PUBLIC_PHOTOS_URL ||
    (process.env.NODE_ENV === "production" ? "https://photo.jerryqiu.com" : "http://localhost:3002")
  ).replace(/\/$/, "");

const site = (env, dev, prod) =>
  (process.env[env] || (process.env.NODE_ENV === "production" ? prod : dev)).replace(/\/$/, "");
const music = () => site("NEXT_PUBLIC_MUSIC_URL", "http://localhost:3003", "https://music.jerryqiu.com");
const flying = () => site("NEXT_PUBLIC_FLYING_URL", "http://localhost:3004", "https://flying.jerryqiu.com");

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
      // Music and flying are their own deployments (docs/project/14-sites-and-deployment.md); old path links move there.
      { source: "/music", destination: `${music()}/`, permanent: true },
      { source: "/music/:path*", destination: `${music()}/:path*`, permanent: true },
      { source: "/flying", destination: `${flying()}/`, permanent: true },
      { source: "/flying/:path*", destination: `${flying()}/:path*`, permanent: true },
      { source: "/api/rss", destination: "/writing/rss.xml", permanent: true },
    ];
  },
};
