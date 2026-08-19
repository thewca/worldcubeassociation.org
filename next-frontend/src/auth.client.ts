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
    // Carries the server's `customSession` return type through to `useSession`.
    customSessionClient<typeof auth>(),
  ],
});

export const { useSession, signOut } = authClient;

export type Session = typeof authClient.$Infer.Session;

/** Wrapped rather than re-exported so call sites do not repeat the provider id. */
export function signIn(callbackURL?: string) {
  return authClient.signIn.oauth2({
    providerId: WCA_PROVIDER_ID,
    callbackURL: callbackURL ?? window.location.href,
  });
}
