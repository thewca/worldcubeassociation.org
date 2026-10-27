import config from "@payload-config";
import { cacheLife, cacheTag } from "next/cache";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import {
  getPayload,
  type CollectionSlug,
  type GlobalSlug,
  type TypedLocale,
} from "payload";
import { collectionCacheTag } from "@/lib/payload/collections";

export const globalCacheTag = (slug: GlobalSlug) => `payload-global:${slug}`;

// Globals that embed documents editors maintain in a collection, so that saving such a document
//   also refreshes the global. Media is left out: images are swapped by editing the global itself.
const GLOBAL_RELATED_COLLECTIONS: Partial<
  Record<GlobalSlug, CollectionSlug[]>
> = {
  "faq-page": ["faqQuestions", "faqCategories"],
  "documents-page": ["documents"],
  home: ["announcements", "testimonials"],
};

// The build reads from the nightly public dump, which can lag behind the live CMS by a day
//   and is production content even for staging builds. A short lifetime makes the first
//   requests after a deploy replace it with live data; runtime reads stay cached until an edit.
export function payloadCacheLife() {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    cacheLife("minutes");
  } else {
    cacheLife("max");
  }
}

export async function getCachedGlobal<TSlug extends GlobalSlug>(
  slug: TSlug,
  depth?: number,
  locale?: TypedLocale,
) {
  "use cache";
  cacheTag(
    globalCacheTag(slug),
    ...(GLOBAL_RELATED_COLLECTIONS[slug] ?? []).map(collectionCacheTag),
  );
  payloadCacheLife();

  const payload = await getPayload({ config });

  return payload.findGlobal({ slug, depth, locale });
}
