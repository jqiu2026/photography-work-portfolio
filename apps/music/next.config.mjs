/** @type {import('next').NextConfig} */
export default {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: [
    "@jerryqiu/sites",
    "@jerryqiu/db",
    "@jerryqiu/auth",
    "@jerryqiu/email",
    "@jerryqiu/payments",
    "@jerryqiu/protect",
    "@jerryqiu/scores",
    "@jerryqiu/storage",
  ],
  // PGlite, sharp and pdf-lib's native-adjacent deps must not be bundled.
  serverExternalPackages: ["sharp", "pg", "@electric-sql/pglite"],
  // Only this site may frame itself; scores and receipts are never embeddable.
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }] }];
  },
};
