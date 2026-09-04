import type { GenericOAuthConfig } from "better-auth/plugins";
import {
  WCA_OIDC_CLIENT_ID,
  WCA_OIDC_CLIENT_SECRET,
  WCA_OIDC_ISSUER,
} from "@/lib/wca/oauth/config";

export const WCA_PROVIDER_ID = "WCA";
export const WCA_CMS_PROVIDER_ID = `${WCA_PROVIDER_ID}-CMS`;

/** Names each instance and its cookie jar; shared so the middleware looks for the same
 *  cookie the site instance writes. */
export const WCA_APP_NAME = "wca";
export const WCA_CMS_APP_NAME = `${WCA_APP_NAME}-cms`;

// Must equal `routes.api` + `authBasePath`: Better Auth's router 404s anything outside its own
//   `basePath`, and our Payload config moves the API to `/api/payload`.
export const CMS_AUTH_BASE_PATH = "/api/payload/auth";

const WCA_DISCOVERY_URL = `${WCA_OIDC_ISSUER}/.well-known/openid-configuration`;

interface WcaProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  roles?: string[];
  preferred_username?: string;
}

const baseWcaProvider: GenericOAuthConfig = {
  providerId: WCA_PROVIDER_ID,
  clientId: WCA_OIDC_CLIENT_ID,
  clientSecret: WCA_OIDC_CLIENT_SECRET,
  discoveryUrl: WCA_DISCOVERY_URL,
  // `manage_registrations` is what lets this frontend submit and edit registrations on the
  //   signed-in user's behalf; without it the registration endpoints answer 403.
  scopes: ["openid", "profile", "email", "manage_registrations"],
  mapProfileToUser: (profile) => {
    const wcaProfile = profile as unknown as WcaProfile;

    return {
      name: wcaProfile.name,
      email: wcaProfile.email,
      // Our provider issues no `email_verified` claim, so Better Auth would treat every address
      //   as unverified and refuse to link a returning user. These are minted by the backend,
      //   not typed in, so calling them verified states what is already true.
      emailVerified: true,
      image: wcaProfile.picture,
      roles: wcaProfile.roles,
      wcaId: wcaProfile.preferred_username,
      // The OIDC subject is the numeric `User#id` in Rails. Also on the account as `accountId`,
      //   but carrying it here lets call sites read it straight off the session.
      wcaUserId: Number(wcaProfile.sub),
    };
  },
};

export const siteWcaProvider = baseWcaProvider;

export const cmsWcaProvider: GenericOAuthConfig = {
  ...baseWcaProvider,
  providerId: WCA_CMS_PROVIDER_ID,
  name: WCA_APP_NAME,
  scopes: ["openid", "profile", "email", "cms"],
  // Re-sync roles on every CMS login, so team changes in Rails reach Payload.
  overrideUserInfo: true,
};

/**
 * These are provider-owned, so `input: false` looks like the obvious way to stop a client
 * writing them. It is the wrong tool: Better Auth applies that flag to *all* input, including
 * the object `mapProfileToUser` returns, so the fields would be stripped on the way in and
 * never populated at all. Concretely, a WST member would sign in with `roles: undefined` and
 * `access.admin` in `collections/Users.ts` would then lock them out of the Payload admin panel.
 *
 * Client writes are blocked where it actually matters instead: `payload.auth.ts` refuses
 * `/update-user` outright, and `roles` carries `create`/`update` field access of `false` in
 * `collections/Users.ts`, closing the Payload REST/GraphQL path.
 */
export const wcaUserAdditionalFields = {
  roles: { type: "string[]", required: false },
  wcaId: { type: "string", required: false },
  wcaUserId: { type: "number", required: false },
} as const;
