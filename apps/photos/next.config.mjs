/** @type {import('next').NextConfig} */
export default {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: [
    "@halation/ui",
    "@jerryqiu/sites",
    "@jerryqiu/render",
    "@jerryqiu/mocks",
    "@jerryqiu/payments",
    "@jerryqiu/prints",
    "@jerryqiu/auth",
    "@jerryqiu/db",
    "@jerryqiu/protect",
    "@jerryqiu/storage",
    "@jerryqiu/inbox",
    "@jerryqiu/email",
    "@jerryqiu/media",
  ],
  // Bundled photographs live in private/ (never public/); the manifests are read by pages, the derivatives by the image route.
  outputFileTracingIncludes: {
    "/*": ["./private/opt/**/manifest.json"],
    "/api/img/*": ["./private/opt/**/*"],
  },
  serverExternalPackages: ["sharp", "pg", "@electric-sql/pglite"],
  // photos.jerryqiu.com is an alias: send every path to the canonical photo.jerryqiu.com (Q57).
  // Embedding: only /embed/* may be framed, and only by the owner's own sites (EMBED_ALLOWED_ORIGINS adds more).
  async headers() {
    const extra = (process.env.EMBED_ALLOWED_ORIGINS ?? "").split(/[\s,]+/).filter(Boolean);
    const allowed = ["'self'", "https://jerryqiu.com", "https://www.jerryqiu.com", ...extra].join(" ");
    return [
      { source: "/embed/:path*", headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${allowed}` }] },
      { source: "/((?!embed).*)", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }] },
    ];
  },
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
