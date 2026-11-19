import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // forbidden() → HTTP 403 for admin pages a role may not open (RBAC, K-05).
  experimental: { authInterrupts: true },
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
