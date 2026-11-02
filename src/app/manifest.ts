import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Choose Your Book",
    short_name: "Mi pila",
    description:
      "Elegí tu próximo libro con filtros y ruleta, y llevá el registro de tus lecturas.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4ebd9",
    theme_color: "#2f4a3a",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
