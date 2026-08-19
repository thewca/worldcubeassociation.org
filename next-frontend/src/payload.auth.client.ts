"use client";

import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";
import { WCA_CMS_PROVIDER_ID } from "@/auth.config";

/**
 * Browser client for the CMS auth instance. Separate from `auth.client.ts` because the two
 * instances are mounted at different base paths and keep separate cookies.
 */
export const cmsAuthClient = createAuthClient({
  basePath: "/api/payload/auth",
  plugins: [genericOAuthClient()],
});

/**
 * Starts the `cms`-scoped WCA login.
 *
 * `signIn.oauth2` rather than `signIn.social`: our provider comes from the `genericOAuth`
 * plugin, and the bundled Payload login view only knows how to drive Better Auth's built-in
 * `socialProviders` — which is why this view replaces it.
 */
export function signInToCms() {
  return cmsAuthClient.signIn.oauth2({
    providerId: WCA_CMS_PROVIDER_ID,
    callbackURL: "/payload",
  });
}
