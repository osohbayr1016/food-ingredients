import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Food Ingredients",
    short_name: "Food",
    description: "Mobile-first Mongolian-centric recipe explorer",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "mn",
    background_color: "#ffffff",
    theme_color: "#E23E3E",
    icons: [{ src: "/favicon.ico", sizes: "48x48", type: "image/x-icon", purpose: "any" }],
  };
}
