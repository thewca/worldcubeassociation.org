import config from "@payload-config";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload, type CollectionSlug, type TypedLocale } from "payload";

export const collectionCacheTag = (slug: CollectionSlug) =>
  `payload-collection:${slug}`;

export async function getCachedCollection<TSlug extends CollectionSlug>(
  slug: TSlug,
  locale?: TypedLocale,
  depth?: number,
  pagination = false,
  sort = "_order",
) {
  "use cache";
  cacheTag(collectionCacheTag(slug));
  cacheLife("max");

  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: slug,
    locale,
    sort,
    pagination,
    depth,
  });

  return docs;
}
