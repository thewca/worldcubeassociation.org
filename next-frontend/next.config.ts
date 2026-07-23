import { withPayload } from "@payloadcms/next/withPayload";
import { existsSync, readFileSync } from "fs";
import type { NextConfig } from "next";
import nextRoutes from "nextjs-routes/config";
import path from "path";

// New Relic is CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nrExternals = require("newrelic/load-externals");

// Recursively collect the transitive dependencies of a package so that
// outputFileTracingIncludes can ensure they all land in the standalone output.
// Without this, Next.js's file tracer misses packages that are loaded via
// dynamic ESM imports (e.g. meriyah, loaded by @apm-js-collab/code-transformer
// which is pulled in by @newrelic/security-agent).
function getTransitiveDeps(
  pkgName: string,
  visited = new Set<string>(),
): string[] {
  if (visited.has(pkgName)) return [];
  visited.add(pkgName);
  const pkgJsonPath = path.join(
    __dirname,
    "node_modules",
    pkgName,
    "package.json",
  );
  if (!existsSync(pkgJsonPath)) return [];
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    const result = [pkgName];
    for (const dep of Object.keys({
      ...pkg.dependencies,
      ...pkg.optionalDependencies,
    })) {
      result.push(...getTransitiveDeps(dep, visited));
    }
    return result;
  } catch {
    return [pkgName];
  }
}

const newrelicDeps = getTransitiveDeps("newrelic");

const withRoutes = nextRoutes({ outDir: "src/types" });

const shouldUseProprietaryFont = process.env.PROPRIETARY_FONT === "TTNormsPro";

const nextConfig: NextConfig = {
  serverExternalPackages: ["newrelic"],
  webpack: (config, { isServer, webpack }) => {
    if (!shouldUseProprietaryFont) {
      config.plugins = [
        ...config.plugins,
        new webpack.IgnorePlugin({
          resourceRegExp: /fonts\.proprietary$/,
          contextRegExp: /\(wca\)/,
        }),
      ];
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
  // Explicitly include newrelic and every transitive dependency in the
  // standalone output. Next.js's file tracer misses packages loaded via
  // dynamic ESM imports (e.g. meriyah via @apm-js-collab/code-transformer).
  // getTransitiveDeps() walks the full dep tree at build time so this list
  // stays accurate automatically when newrelic updates its dependencies.
  outputFileTracingIncludes: {
    "**": newrelicDeps.map((dep) => `./node_modules/${dep}/**/*`),
  },
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
