import config from "@payload-config";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload, type CollectionSlug } from "payload";

export const documentCacheTag = (slug: CollectionSlug) =>
  `payload-collection:${slug}`;

export async function getCachedCollection<TSlug extends CollectionSlug>(
  slug: TSlug,
  depth?: number,
  pagination = false,
  sort = "_order",
) {
  "use cache";
  cacheTag(documentCacheTag(slug));
  cacheLife("max");

  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: slug,
    sort,
    pagination,
    depth,
  });

  return docs;
}
