import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import nextRoutes from "nextjs-routes/config";
import fs from "fs";
import path from "path";

// New Relic is CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nrExternals = require("newrelic/load-externals");

const withRoutes = nextRoutes({ outDir: "src/types" });
const proprietaryFontPath = path.resolve(
  __dirname,
  "src/styles/fonts/TTNormsPro/TT_Norms_Pro_Light.woff2",
);
const shouldUseProprietaryFont =
  process.env.PROPRIETARY_FONT === "TTNormsPro" &&
  fs.existsSync(proprietaryFontPath);

const nextConfig: NextConfig = {
  serverExternalPackages: ["newrelic"],
  webpack: (config, { isServer }) => {
    if (shouldUseProprietaryFont) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@/styles/fonts": path.resolve(
          __dirname,
          "src/styles/fonts.proprietary.ts",
        ),
      };
    }

    if (isServer && process.env.NODE_ENV === "production") {
      nrExternals(config);
    }
    return config;
  },
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  reactCompiler: true,
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
