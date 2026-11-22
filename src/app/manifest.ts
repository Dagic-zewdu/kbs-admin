import type { MetadataRoute } from "next";

/** Lets the admin be added to a phone's home screen and open full screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-commerce Cosmetics Admin",
    short_name: "EC Admin",
    description: "Admin site for the companies selling on E-commerce Cosmetics",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#db2777",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
