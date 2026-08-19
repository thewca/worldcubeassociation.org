import { betterAuth, type BetterAuthOptions } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import {
  payloadAdapter,
  type CreateAuthFunction,
} from "@delmaredigital/payload-better-auth";
import {
  cmsWcaProvider,
  wcaUserAdditionalFields,
  WCA_CMS_PROVIDER_ID,
} from "@/auth.config";

// Must equal `routes.api` + `authBasePath`: Better Auth's router 404s anything outside its own
//   `basePath`, and our Payload config moves the API to `/api/payload`.
const CMS_AUTH_BASE_PATH = "/api/payload/auth";

export const cmsBetterAuthOptions: BetterAuthOptions = {
  appName: "wca-cms",
  user: { additionalFields: wcaUserAdditionalFields },
  account: {
    accountLinking: {
      enabled: true,
      // Attaches a CMS login to an existing Payload user with the same address. Safe because
      //   the provider is one we control — this replaces `allowDangerousEmailAccountLinking`.
      trustedProviders: [WCA_CMS_PROVIDER_ID],
      // Transitional: every row payload-authjs wrote has `emailVerified` unset, and the default
      //   gate would refuse to link them, locking existing CMS users out. Better Auth promotes
      //   such a row to verified as it links, so this heals each account on its owner's next
      //   login and is redundant once they have all signed in.
      requireLocalEmailVerified: false,
    },
  },
  plugins: [genericOAuth({ config: [cmsWcaProvider] })],
};

/**
 * Unlike the site instance this one is database-backed, so logging in provisions a Payload user.
 * That is deliberate: only `cms`-scoped logins get a row, keeping `users` to CMS operators.
 */
export const createCmsAuth: CreateAuthFunction = (payload) =>
  betterAuth({
    ...cmsBetterAuthOptions,
    database: payloadAdapter({ payloadClient: payload }),
    basePath: CMS_AUTH_BASE_PATH,
    secret: process.env.AUTH_SECRET,
    // Keeps the admin cookie distinct, so a CMS-scoped session is never read as a site one.
    advanced: { cookiePrefix: "wca-cms" },
  });
