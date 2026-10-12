/** @type {import('next').NextConfig} */
export default {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: [
    "@placeholder/ui",
    "@jerryqiu/sites",
    "@jerryqiu/auth",
    "@jerryqiu/db",
    "@jerryqiu/protect",
    "@jerryqiu/storage",
    "@jerryqiu/inbox",
    "@jerryqiu/media",
  ],
  serverExternalPackages: ["sharp", "pg", "@electric-sql/pglite"],
};
