import config from "@payload-config";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload, type GlobalSlug, type TypedLocale } from "payload";

export const globalCacheTag = (slug: GlobalSlug) => `payload-global:${slug}`;

export async function getCachedGlobal<TSlug extends GlobalSlug>(
  slug: TSlug,
  locale: TypedLocale,
  depth?: number,
) {
  "use cache: remote";
  cacheTag(globalCacheTag(slug));
  cacheLife("max");

  const payload = await getPayload({ config });

  return payload.findGlobal({ slug, locale, depth });
}
