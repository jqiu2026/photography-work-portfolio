import type { MetadataRoute } from "next";

/**
 * Lets the site (and the studio, which is the same app) be installed to a phone's home screen. It opens in the
 * studio, which is what an installed copy is for; visitors never see an install prompt they did not ask for.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jerry Qiu Photography",
    short_name: "JQ Studio",
    description: "Photography by Jerry Qiu, and the studio behind it.",
    start_url: "/studio/overview",
    scope: "/",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
