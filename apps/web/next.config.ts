import type { NextConfig } from "next";
import path from "node:path";

/** Cloudflare Pages / static hosting when STATIC_EXPORT=1; Docker keeps standalone. */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = staticExport
  ? {
      output: "export",
      images: { unoptimized: true },
    }
  : {
      output: "standalone",
      outputFileTracingRoot: path.join(__dirname, "../.."),
    };

export default nextConfig;
