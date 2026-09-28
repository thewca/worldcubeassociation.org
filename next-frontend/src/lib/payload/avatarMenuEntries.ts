import config from "@payload-config";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

export const AVATAR_MENU_ENTRIES_CACHE_TAG =
  "payload-collection:avatarMenuEntries";

export async function getCachedAvatarMenuEntries() {
  "use cache";
  cacheTag(AVATAR_MENU_ENTRIES_CACHE_TAG);
  cacheLife("max");

  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "avatarMenuEntries",
    sort: "_order",
    pagination: false,
  });

  return docs;
}
