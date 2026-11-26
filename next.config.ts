import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone with a minimal server.js -> small Docker image
  output: "standalone",
  poweredByHeader: false,
  // The expiry-date reader's engine and models never change under the same path: cached for a year
  async headers() {
    const cacheForever = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/ocr/:path*", headers: cacheForever },
      { source: "/ort/:path*", headers: cacheForever },
    ];
  },
  turbopack: {
    // The plain WebAssembly engine for the expiry-date reader, not the bigger WebGPU one
    resolveAlias: { "onnxruntime-web": "onnxruntime-web/wasm" },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
