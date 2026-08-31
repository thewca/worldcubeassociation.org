"use client";

import { createAuthClient } from "better-auth/react";
import { WCA_CMS_PROVIDER_ID } from "@/auth.config";

/** Separate from `auth.client.ts`: the two instances have different base paths and cookies. */
export const cmsAuthClient = createAuthClient({
  basePath: "/api/payload/auth",
});

export function signInToCms() {
  return cmsAuthClient.signIn.social({
    provider: WCA_CMS_PROVIDER_ID,
    callbackURL: "/payload",
  });
}
