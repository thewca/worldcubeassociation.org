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

/**
 * Payload serves the plugin's endpoints under `routes.api` + `authBasePath`. Our Payload config
 * sets `routes.api` to `/api/payload`, and Better Auth's router 404s anything outside its own
 * `basePath`, so the two have to be spelled out to agree.
 */
const CMS_AUTH_BASE_PATH = "/api/payload/auth";

/**
 * Shared between the collection generator (which reads the schema to build the `sessions`,
 * `accounts` and `verifications` collections) and the auth instance itself.
 */
export const cmsBetterAuthOptions: BetterAuthOptions = {
  appName: "wca-cms",
  user: { additionalFields: wcaUserAdditionalFields },
  account: {
    accountLinking: {
      enabled: true,
      // Lets a CMS login attach to an existing Payload user with the same address instead of
      //   being rejected. Everyone here comes from the same WCA OIDC provider, which is the
      //   case AuthJS documented as safe for its `allowDangerousEmailAccountLinking`
      //   equivalent: the provider is one we control and it verifies the address.
      trustedProviders: [WCA_CMS_PROVIDER_ID],
    },
  },
  plugins: [genericOAuth({ config: [cmsWcaProvider] })],
};

/**
 * The CMS auth instance. Unlike the public-site instance in `auth.ts`, this one **is** backed by
 * a database — logging in here provisions a Payload user. That is the point: only people who
 * come through the `cms`-scoped provider get a record in Payload, so the `users` collection
 * stays limited to CMS operators rather than mirroring every WCA account.
 */
export const createCmsAuth: CreateAuthFunction = (payload) =>
  betterAuth({
    ...cmsBetterAuthOptions,
    database: payloadAdapter({ payloadClient: payload }),
    basePath: CMS_AUTH_BASE_PATH,
    secret: process.env.AUTH_SECRET,
    // Keeps the admin session cookie distinct from the public-site one, so a CMS-scoped token
    //   can never be picked up as an ordinary site session (and vice versa).
    advanced: { cookiePrefix: "wca-cms" },
  });
