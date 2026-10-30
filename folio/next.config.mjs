/** @type {import("next").NextConfig} */
export default {
  poweredByHeader: false,
  // the photos are already resized WebP files, so they are served as they are
  images: { unoptimized: true },
  async headers() {
    return [
      { source: "/photos/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }, { key: "X-Robots-Tag", value: "noimageindex" }] },
    ];
  },
};
