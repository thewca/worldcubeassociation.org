import config from "@payload-config";
import { cacheTag } from "next/cache";
import {
  getPayload,
  type CollectionSlug,
  type FindOptions,
  type PaginatedDocs,
  type TransformCollectionWithSelect,
  type SelectType,
} from "payload";
import { payloadCacheLife } from "@/lib/payload/globals";

export const collectionCacheTag = (slug: CollectionSlug) =>
  `payload-collection:${slug}`;

export async function findCached<TSlug extends CollectionSlug>(
  options: FindOptions<TSlug, SelectType>,
) {
  "use cache";
  cacheTag(collectionCacheTag(options.collection));
  payloadCacheLife();

  const payload = await getPayload({ config });

  const find = payload.find as (
    options: FindOptions<TSlug, SelectType>,
  ) => Promise<PaginatedDocs<TransformCollectionWithSelect<TSlug, SelectType>>>;

  return find(options);
}
