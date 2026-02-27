import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import nextRoutes from "nextjs-routes/config";
import path from "path";

// New Relic is CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nrExternals = require("newrelic/load-externals");

const withRoutes = nextRoutes({ outDir: "src/types" });

const nextConfig: NextConfig = {
  serverExternalPackages: ["newrelic"],
  webpack: (config, { isServer }) => {
    if (isServer && process.env.NODE_ENV === "production") {
      nrExternals(config);
    }
    return config;
  },
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
    reactCompiler: true,
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
  webpack(config) {
    if (!process.env.PROPRIETARY_FONT) {
      config.resolve.alias["@/styles/fonts"] =
        require("path").resolve(__dirname, "src/styles/fonts/empty-font.ts");
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/documentation",
        destination: "/api.html",
      },
    ];
  },
  // Usual Node/Yarn monorepo structure is to have one root lockfile,
  //   and then several sub-folders that source their dependencies from that "parent" lockfile.
  //   So NextJS's standard behavior is to include dependency lockfiles from the repository root.
  // Our setup breaks with this convention because the NextJS folder is its own, fully independent project.
  //   That's why we need to tell NextJS to only look in its own folder, and *not* the default repository root.
  outputFileTracingRoot: path.join(__dirname),
};

export default withPayload(withRoutes(nextConfig));
