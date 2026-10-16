/** @type {import('next').NextConfig} */
export default {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: [
    "@halation/ui",
    "@jerryqiu/sites",
    "@jerryqiu/render",
    "@jerryqiu/mocks",
    "@jerryqiu/payments",
    "@jerryqiu/auth",
    "@jerryqiu/db",
    "@jerryqiu/protect",
    "@jerryqiu/storage",
    "@jerryqiu/inbox",
    "@jerryqiu/media",
    "@jerryqiu/shootproof",
  ],
  serverExternalPackages: ["sharp", "pg", "@electric-sql/pglite"],
  // photos.jerryqiu.com is an alias: send every path to the canonical photo.jerryqiu.com (Q57).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "photos.jerryqiu.com" }],
        destination: "https://photo.jerryqiu.com/:path*",
        permanent: true,
      },
    ];
  },
};
