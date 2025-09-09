import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import nextRoutes from "nextjs-routes/config";

const withRoutes = nextRoutes({ outDir: "src/types" });

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
    incomingRequests: {
      ignore: [],
    },
  },
  images: {
    remotePatterns: [
      new URL("https://worldcubeassociation.org/**"),
      new URL("https://avatars.worldcubeassociation.org/**"),
    ],
  },
  output: "standalone",
  productionBrowserSourceMaps: true,
  async rewrites() {
    return [
      {
        source: "/api_documentation",
        destination: "/api.html",
      },
    ];
  },
};

export default withPayload(withRoutes(nextConfig));
