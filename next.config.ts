import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components (PPR) is left off for now: several shadcn/Base UI primitives call
  // non-deterministic APIs (crypto.randomBytes for id generation, etc.) during SSR,
  // which Cache Components' stricter prerenderer treats as a hard build error. Revisit
  // once the component set is audited for cache-safety.
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
