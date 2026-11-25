import { cacheLife } from "next/cache";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { CollectionSlug, GlobalSlug } from "payload";

export type RuntimeCacheLife = "minutes" | "max";

export const collectionCacheTag = (slug: CollectionSlug) =>
  `payload-collection:${slug}`;

export const globalCacheTag = (slug: GlobalSlug) => `payload-global:${slug}`;

// The build reads from the nightly public dump, which can lag behind the live CMS by a day
//   and is production content even for staging builds. A short lifetime makes the first
//   requests after a deploy replace it with live data; runtime reads stay cached until an edit.
export function payloadCacheLife(runtimeCacheLife: RuntimeCacheLife = "max") {
  const isBuilding = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  if (isBuilding || runtimeCacheLife === "minutes") {
    cacheLife("minutes");
  } else {
    cacheLife("max");
  }
}
