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

/** Derived so a field added to the OIDC profile is covered without touching the guard below. */
const providerOwned = new Set<string>(Object.keys(wcaUserAdditionalFields));

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
  databaseHooks: {
    user: {
      update: {
        before: async (user, context) => {
          // `/update-user` is the endpoint a signed-in user can call for themselves, and
          //   `roles` is what `access.admin` reads to decide who gets into Payload — so a CMS
          //   operator could otherwise promote themselves. The provider's own updates arrive
          //   through the sign-in flow rather than this path, so they are unaffected.
          if (context?.path !== "/update-user") {
            return;
          }

          const allowed = Object.fromEntries(
            Object.entries(user).filter(([field]) => !providerOwned.has(field)),
          );

          return { data: allowed };
        },
      },
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
