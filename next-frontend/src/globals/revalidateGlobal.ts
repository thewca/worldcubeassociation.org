import { revalidateTag } from "next/cache";
import type { GlobalAfterChangeHook } from "payload";

import { globalCacheTag } from "@/lib/payload/globals";

export const revalidateGlobal: GlobalAfterChangeHook = ({ global }) => {
  // `{ expire: 0 }` rather than a named profile such as "max": every other profile lets Next keep
  //   serving the stale entry while it refreshes in the background, so an editor would not see
  //   their own save. Only expire 0 forces the next request to read from Mongo again.
  revalidateTag(globalCacheTag(global.slug), { expire: 0 });
};
