// @ts-check

// This has to stay a plain JS file: Next.js does not compile `cacheHandlers` entries,
//   it imports them at runtime straight from the path in `next.config.ts`.
//   See https://github.com/vercel/next.js/tree/canary/examples/cache-handler-redis-turbo

import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import { redisCacheHandler } from "@trieb.work/nextjs-turbo-redis-cache";
import nextDefaultCacheHandler from "next/dist/server/lib/cache-handlers/default.js";

const DEFAULT_MAX_MEMORY_SIZE = 50 * 1024 * 1024;

/** @type {import("next/cache").CacheHandler} */
const buildPhaseCacheHandler = {
  get: () => Promise.resolve(undefined),
  set: () => Promise.resolve(),
  refreshTags: () => Promise.resolve(),
  getExpiration: () => Promise.resolve(0),
  updateTags: () => Promise.resolve(),
};

/** @type {import("next/cache").CacheHandler} */
const cacheComponentsHandler =
  PHASE_PRODUCTION_BUILD === process.env.NEXT_PHASE
    ? buildPhaseCacheHandler
    : process.env.REDIS_URL
      ? redisCacheHandler
      : nextDefaultCacheHandler.createDefaultCacheHandler(
          DEFAULT_MAX_MEMORY_SIZE,
        );

export default cacheComponentsHandler;
