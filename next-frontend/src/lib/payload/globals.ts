import config from "@payload-config";
import { cacheTag } from "next/cache";
import {
  getPayload,
  type CollectionSlug,
  type GlobalSlug,
  type TypedLocale,
} from "payload";
import {
  collectionCacheTag,
  globalCacheTag,
  payloadCacheLife,
} from "@/lib/payload/cache";

// Globals that embed documents editors maintain in a collection, so that saving such a document
//   also refreshes the global. Media is left out: images are swapped by editing the global itself.
const GLOBAL_RELATED_COLLECTIONS: Partial<
  Record<GlobalSlug, CollectionSlug[]>
> = {
  "faq-page": ["faqQuestions", "faqCategories"],
  home: ["announcements", "testimonials"],
};

export async function getCachedGlobal<TSlug extends GlobalSlug>(
  slug: TSlug,
  locale: TypedLocale,
  depth?: number,
) {
  "use cache: remote";
  cacheTag(
    globalCacheTag(slug),
    ...(GLOBAL_RELATED_COLLECTIONS[slug] ?? []).map(collectionCacheTag),
  );
  payloadCacheLife();

  const payload = await getPayload({ config });

  return payload.findGlobal({ slug, locale, depth });
}
