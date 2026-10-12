/** @type {import('next').NextConfig} */
const photos = () =>
  (
    process.env.NEXT_PUBLIC_PHOTOS_URL ||
    (process.env.NODE_ENV === "production" ? "https://photos.jerryqiu.com" : "http://localhost:3002")
  ).replace(/\/$/, "");

export default {
  transpilePackages: ["@placeholder/ui", "@jerryqiu/sites"],
  async redirects() {
    return [
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/:slug", destination: "/writing/:slug", permanent: true },
      { source: "/contact", destination: "/connect", permanent: true },
      { source: "/gallery", destination: `${photos()}/`, permanent: false },
      { source: "/api/rss", destination: "/writing/rss.xml", permanent: true },
    ];
  },
};
