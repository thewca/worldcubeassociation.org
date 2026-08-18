import type { GenericOAuthConfig } from "better-auth/plugins";
import {
  WCA_OIDC_CLIENT_ID,
  WCA_OIDC_CLIENT_SECRET,
  WCA_OIDC_ISSUER,
} from "@/lib/wca/oauth/config";

export const WCA_PROVIDER_ID = "WCA";
export const WCA_CMS_PROVIDER_ID = `${WCA_PROVIDER_ID}-CMS`;

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
      image: wcaProfile.picture,
      roles: wcaProfile.roles,
      wcaId: wcaProfile.preferred_username,
      // The OIDC subject is the numeric `User#id` in the Rails backend. Better Auth keeps it
      //   verbatim on the linked account as `accountId`, but carrying it on the user too means
      //   call sites can read it straight off the session.
      wcaUserId: Number(wcaProfile.sub),
    };
  },
};

export const siteWcaProvider = baseWcaProvider;

export const cmsWcaProvider: GenericOAuthConfig = {
  ...baseWcaProvider,
  providerId: WCA_CMS_PROVIDER_ID,
  scopes: ["openid", "profile", "email", "cms"],
  // Refresh the stored roles on every CMS login, so a user who gains or loses a team
  //   membership in Rails has that reflected in Payload the next time they sign in.
  overrideUserInfo: true,
};

/**
 * Extra columns the WCA OIDC provider supplies on top of Better Auth's built-in user fields.
 * `input: false` keeps them server-only — they are set from the OIDC profile, never by a client.
 */
export const wcaUserAdditionalFields = {
  roles: { type: "string[]", required: false, input: false },
  wcaId: { type: "string", required: false, input: false },
  wcaUserId: { type: "number", required: false, input: false },
} as const;
