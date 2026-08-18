"use client";

import { createAuthClient } from "better-auth/react";
import {
  customSessionClient,
  genericOAuthClient,
} from "better-auth/client/plugins";
import type { auth } from "@/auth";
import { WCA_PROVIDER_ID } from "@/auth.config";

export const authClient = createAuthClient({
  plugins: [
    genericOAuthClient(),
    // Carries the server's `customSession` return type through to `useSession`, so call sites
    //   get `session.accessToken` (and the WCA fields on `user`) typed rather than `any`.
    customSessionClient<typeof auth>(),
  ],
});

export const { useSession, signOut } = authClient;

/** The session shape as returned by our `customSession` callback, inferred from the server. */
export type Session = typeof authClient.$Infer.Session;

/**
 * Kicks off the WCA OIDC flow. Wrapped rather than re-exported because `signIn.oauth2` needs
 * the provider id, and every call site wants the same one.
 */
export function signIn(callbackURL?: string) {
  return authClient.signIn.oauth2({
    providerId: WCA_PROVIDER_ID,
    callbackURL: callbackURL ?? window.location.href,
  });
}
