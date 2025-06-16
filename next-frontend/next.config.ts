import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

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

export default withPayload(nextConfig);
