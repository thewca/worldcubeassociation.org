// @ts-check

// This has to stay a plain JS file: Next.js does not compile the `cacheHandler` entry,
//   it imports it at runtime straight from the path in `next.config.ts`.
//   See https://github.com/vercel/next.js/tree/canary/examples/cache-handler-redis-turbo

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import { RedisStringsHandler } from "@trieb.work/nextjs-turbo-redis-cache";

const require = createRequire(import.meta.url);

/** @type {typeof import("next/dist/server/lib/incremental-cache/file-system-cache").default} */
const FileSystemCache =
  require("next/dist/server/lib/incremental-cache/file-system-cache.js").default;

/** @type {import("next/dist/server/lib/incremental-cache").CacheHandler} */
const buildPhaseCacheHandler = {
  get: () => Promise.resolve(null),
  set: () => Promise.resolve(undefined),
  revalidateTag: () => Promise.resolve(undefined),
  resetRequestCache: () => undefined,
};

/** @type {object | undefined} */
let cachedHandler;

export default class IncrementalCacheHandler {
  /** @param {ConstructorParameters<typeof FileSystemCache>[0]} ctx */
  constructor(ctx) {
    if (cachedHandler) {
      return cachedHandler;
    }

    if (PHASE_PRODUCTION_BUILD === process.env.NEXT_PHASE) {
      cachedHandler = buildPhaseCacheHandler;
      return buildPhaseCacheHandler;
    }

    if (!process.env.REDIS_URL) {
      return new FileSystemCache(ctx);
    }

    // The handler is also bundled into the proxy, which constructs it without a `serverDistDir`.
    const buildIdPath = ctx.serverDistDir
      ? join(ctx.serverDistDir, "..", "BUILD_ID")
      : join(process.cwd(), ".next", "BUILD_ID");

    const redisHandler = new RedisStringsHandler({
      keyPrefix:
        process.env.KEY_PREFIX || readFileSync(buildIdPath, "utf8").trim(),
    });

    cachedHandler = redisHandler;
    return redisHandler;
  }
}
