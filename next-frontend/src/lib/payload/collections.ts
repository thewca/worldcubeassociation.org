import config from "@payload-config";
import { cacheTag } from "next/cache";
import {
  getPayload,
  type CollectionSlug,
  type FindOptions,
  type SelectType,
} from "payload";
import {
  collectionCacheTag,
  payloadCacheLife,
  type RuntimeCacheLife,
} from "@/lib/payload/cache";

type FindCachedOptions<TSlug extends CollectionSlug> = Pick<
  FindOptions<TSlug, SelectType>,
  "locale" | "depth" | "sort" | "where" | "limit" | "page" | "pagination"
>;

export async function findCached<TSlug extends CollectionSlug>(
  collection: TSlug,
  {
    locale,
    depth,
    sort,
    where,
    limit,
    page,
    pagination,
  }: FindCachedOptions<TSlug> = {},
  // Use "minutes" when the options contain visitor input, so that arbitrary
  //   input cannot fill the shared cache with long-lived entries.
  runtimeCacheLife?: RuntimeCacheLife,
) {
  "use cache: remote";
  cacheTag(collectionCacheTag(collection));
  payloadCacheLife(runtimeCacheLife);

  const payload = await getPayload({ config });

  return payload.find({
    collection,
    locale,
    depth,
    sort,
    where,
    limit,
    page,
    pagination,
  });
}
