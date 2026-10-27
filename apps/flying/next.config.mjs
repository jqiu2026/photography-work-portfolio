/** @type {import('next').NextConfig} */
export default {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: ["@jerryqiu/sites", "@jerryqiu/db", "@jerryqiu/auth", "@jerryqiu/aviation", "@jerryqiu/protect"],
  serverExternalPackages: ["sharp", "pg", "@electric-sql/pglite"],
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }] }];
  },
};
