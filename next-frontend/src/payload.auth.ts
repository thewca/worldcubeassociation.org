import { betterAuth, type BetterAuthOptions } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import {
  payloadAdapter,
  type CreateAuthFunction,
  hasAnyRole,
} from "@delmaredigital/payload-better-auth";
import {
  cmsWcaProvider,
  wcaUserAdditionalFields,
  CMS_AUTH_BASE_PATH,
  WCA_CMS_APP_NAME,
  WCA_CMS_PROVIDER_ID,
  WCA_ROLES_FIELD,
} from "@/auth.config";

export const PAYLOAD_ADMIN_ROLES = [
  "wst",
  "wct",
  "wat",
  "wmt",
  "board",
  "wic",
  "wrc",
  "wapc",
  "wcat",
  "wrt",
  "wqac",
];

export const cmsBetterAuthOptions: BetterAuthOptions = {
  appName: WCA_CMS_APP_NAME,
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
      create: {
        before: async (user, context) => {
          // Only gate OAuth sign-ups; leave admin-created users and other flows alone.
          if (!context?.path?.includes("/callback/")) return;

          // Make sure that users who don't have access to the dashboard do not get inserted
          //   into BetterAuth in the first place. This has to happen very high in the callback chain,
          //   even _before_ BetterAuth serialize back into Payload (because at that point, a database
          //   row would already need to exist, and we want to prevent just that).
          // See https://delmaredigital.github.io/payload-better-auth/#social-admin-only for details.
          if (!hasAnyRole(user, PAYLOAD_ADMIN_ROLES, WCA_ROLES_FIELD))
            return false;
        },
      },
      update: {
        before: async (_user, context) => {
          // A CMS user is a projection of the WCA account: `overrideUserInfo` rewrites every
          //   field from the OIDC profile on each sign-in, so an edit made here would be
          //   reverted at the next login anyway. Refusing outright also closes `/update-user`
          //   as a way for a CMS operator to award themselves a role, which is what
          //   `access.admin` reads. The provider's own writes arrive on the callback path.
          if (context?.path === "/update-user") {
            return false;
          }
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
    advanced: { cookiePrefix: WCA_CMS_APP_NAME },
  });
