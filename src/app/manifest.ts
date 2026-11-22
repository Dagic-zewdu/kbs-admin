import type { MetadataRoute } from "next";

/** Lets the admin be added to a phone's home screen and open full screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KBS Cosmetics Admin",
    short_name: "KBS Admin",
    description: "Back office for the KBS Cosmetics store",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#db2777",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
