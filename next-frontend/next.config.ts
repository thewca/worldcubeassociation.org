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
  output: "standalone",
};

export default withPayload(withRoutes(nextConfig));
