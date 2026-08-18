import { betterAuth, type BetterAuthOptions } from "better-auth";
import { customSession, genericOAuth } from "better-auth/plugins";
import { getAccessToken } from "better-auth/api";
import { headers } from "next/headers";
import {
  siteWcaProvider,
  wcaUserAdditionalFields,
  WCA_PROVIDER_ID,
} from "@/auth.config";

/**
 * Split out from the `betterAuth()` call because `customSession` needs the very same options
 * object to infer the session type it is wrapping — without it, the WCA fields on `user` come
 * back untyped.
 */
const siteAuthOptions = {
  appName: "wca",
  secret: process.env.AUTH_SECRET,
  // Pinned explicitly rather than left to derive from `appName`, so it can never drift into
  //   the CMS instance's cookie namespace (see `payload.auth.ts`).
  advanced: { cookiePrefix: "wca" },
  // `baseURL` is intentionally unset so Better Auth infers the origin from the incoming
  //   request, which keeps dev (localhost) and Docker (wca_on_rails) working without extra
  //   config. Deployments behind a proxy set BETTER_AUTH_URL instead.
  user: { additionalFields: wcaUserAdditionalFields },
  plugins: [genericOAuth({ config: [siteWcaProvider] })],
} satisfies BetterAuthOptions;

/**
 * The public-site auth instance.
 *
 * Deliberately configured **without** a `database`, which puts Better Auth in stateless mode:
 * the session and the linked OAuth account (including the Rails access/refresh tokens) live
 * only in signed cookies. Rails stays the single source of truth for who a user is, and
 * ordinary WCA users are never written into Payload's Mongo — only CMS logins are, via the
 * separate instance in `payload.config.ts`.
 */
export const auth = betterAuth({
  ...siteAuthOptions,
  plugins: [
    ...siteAuthOptions.plugins,
    // Must stay last: `customSession` overrides `/get-session`, and it should wrap whatever
    //   the plugins above have already contributed to the session.
    customSession(async ({ user, session }, ctx) => {
      // Re-reads the account cookie and transparently refreshes the Rails access token when
      //   it is within seconds of expiring, so call sites can keep treating `accessToken` as
      //   a plain synchronous field on the session.
      const tokens = await getAccessToken({
        ...ctx,
        method: "POST",
        body: { providerId: WCA_PROVIDER_ID, userId: user.id },
        asResponse: false,
      }).catch(() => null);

      return {
        user,
        session,
        accessToken: tokens?.accessToken,
      };
    }, siteAuthOptions),
  ],
});

type RawSession = Awaited<ReturnType<typeof auth.api.getSession>>;

/** A session we can actually call the Rails API with. */
export type Session = NonNullable<RawSession> & { accessToken: string };

/**
 * Server-side session accessor, replacing the AuthJS `auth()` helper.
 *
 * A session whose access token could not be refreshed is reported as no session at all: the
 * refresh token has been spent and Rails will reject anything we send, so the only way forward
 * is a fresh login. Collapsing the two cases here means call sites keep their single
 * `if (!session)` guard and can treat `accessToken` as always present.
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.accessToken) {
    return null;
  }

  return session as Session;
}
