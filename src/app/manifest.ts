import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Handwerker Service App",
    short_name: "Handwerker",
    description: "Auftragssteuerung für Baustelle und Büro",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f4f7fb",
    theme_color: "#007aff",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
