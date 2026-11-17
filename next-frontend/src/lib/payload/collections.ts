import config from "@payload-config";
import { cacheTag } from "next/cache";
import {
  getPayload,
  type CollectionSlug,
  type TypedLocale,
  type Where,
} from "payload";
import { payloadCacheLife } from "@/lib/payload/globals";

export const collectionCacheTag = (slug: CollectionSlug) =>
  `payload-collection:${slug}`;

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
  }: {
    locale?: TypedLocale;
    depth?: number;
    sort?: string;
    where?: Where;
    limit?: number;
    page?: number;
    pagination?: boolean;
  } = {},
) {
  "use cache";
  cacheTag(collectionCacheTag(collection));
  payloadCacheLife();

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
