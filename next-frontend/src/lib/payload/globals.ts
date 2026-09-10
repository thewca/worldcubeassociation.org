import config from "@payload-config";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload, type GlobalSlug } from "payload";

export const globalCacheTag = (slug: GlobalSlug) => `payload-global:${slug}`;

export async function getCachedGlobal<TSlug extends GlobalSlug>(slug: TSlug) {
  "use cache";
  cacheTag(globalCacheTag(slug));
  cacheLife("max");

  const payload = await getPayload({ config });

  return payload.findGlobal({ slug });
}
