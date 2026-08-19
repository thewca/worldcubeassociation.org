"use client";

import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";
import { WCA_CMS_PROVIDER_ID } from "@/auth.config";

/** Separate from `auth.client.ts`: the two instances have different base paths and cookies. */
export const cmsAuthClient = createAuthClient({
  basePath: "/api/payload/auth",
  plugins: [genericOAuthClient()],
});

// `signIn.oauth2`, not `signIn.social`: the latter only covers Better Auth's built-in providers,
//   and ours comes from the `genericOAuth` plugin.
export function signInToCms() {
  return cmsAuthClient.signIn.oauth2({
    providerId: WCA_CMS_PROVIDER_ID,
    callbackURL: "/payload",
  });
}
