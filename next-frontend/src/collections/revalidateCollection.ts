import { revalidateTag } from "next/cache";
import type { CollectionAfterChangeHook } from "payload";
import { collectionCacheTag } from "@/lib/payload/collections";

type RevalidateCollectionProps = Pick<
  Parameters<CollectionAfterChangeHook>[0],
  "collection"
>;

export const revalidateCollection = ({
  collection,
}: RevalidateCollectionProps) => {
  // `{ expire: 0 }` rather than a named profile such as "max": every other profile lets Next keep
  //   serving the stale entry while it refreshes in the background, so an editor would not see
  //   their own save. Only expire 0 forces the next request to read from Mongo again.
  revalidateTag(collectionCacheTag(collection.slug), { expire: 0 });
};
