/** @type {import('next').NextConfig} */
export default {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: [
    "@placeholder/ui",
    "@jerryqiu/sites",
    "@jerryqiu/render",
    "@jerryqiu/auth",
    "@jerryqiu/db",
    "@jerryqiu/protect",
    "@jerryqiu/storage",
    "@jerryqiu/inbox",
    "@jerryqiu/media",
    "@jerryqiu/shootproof",
  ],
  serverExternalPackages: ["sharp", "pg", "@electric-sql/pglite"],
};
