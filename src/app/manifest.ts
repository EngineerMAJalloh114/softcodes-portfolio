import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { palette } from "@/theme/palette";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} · ${site.shortName}`,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: palette.dark.bg,
    theme_color: palette.dark.bg,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
