/** @type {import('next').NextConfig} */
export default {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: ["@halation/ui", "@jerryqiu/sites", "@jerryqiu/mocks", "@jerryqiu/db"],
  // PGlite and sharp are native/WASM packages that must not be bundled.
  serverExternalPackages: ["sharp", "pg", "@electric-sql/pglite"],
};
