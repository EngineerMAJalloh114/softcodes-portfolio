import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // forbidden() → HTTP 403 for admin pages a role may not open (RBAC, K-05).
  experimental: {
    authInterrupts: true,
    // Media uploads go through server actions (largest allowed file: 15 MB PDF).
    serverActions: { bodySizeLimit: "16mb" },
  },
  images: {
    // Public media bucket on Neon object storage (DEC-32); keys are unique per upload.
    remotePatterns: [{ protocol: "https", hostname: "**.neon.tech", pathname: "/public-assets/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
