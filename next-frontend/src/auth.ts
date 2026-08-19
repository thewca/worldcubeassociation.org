import { betterAuth, type BetterAuthOptions } from "better-auth";
import { customSession, genericOAuth } from "better-auth/plugins";
import { getAccessToken } from "better-auth/api";
import { headers } from "next/headers";
import {
  siteWcaProvider,
  wcaUserAdditionalFields,
  WCA_PROVIDER_ID,
} from "@/auth.config";

// Split out because `customSession` needs the same options object to infer the session type it
//   wraps; without it the WCA fields on `user` come back untyped.
const siteAuthOptions = {
  appName: "wca",
  secret: process.env.AUTH_SECRET,
  // Pinned so it cannot drift into the CMS instance's namespace (see `payload.auth.ts`).
  advanced: { cookiePrefix: "wca" },
  // `baseURL` is deliberately unset: Better Auth then infers it per request, which is what
  //   makes dev and Docker work unconfigured. Behind a proxy, set BETTER_AUTH_URL.
  user: { additionalFields: wcaUserAdditionalFields },
  plugins: [genericOAuth({ config: [siteWcaProvider] })],
} satisfies BetterAuthOptions;

/**
 * Omitting `database` is what puts Better Auth in stateless mode: session and linked account
 * (including the Rails tokens) live only in signed cookies. That is how ordinary WCA users stay
 * out of Payload's Mongo — only CMS logins get a row, via the instance in `payload.auth.ts`.
 */
export const auth = betterAuth({
  ...siteAuthOptions,
  plugins: [
    ...siteAuthOptions.plugins,
    // Must stay last: `customSession` overrides `/get-session`, and it should wrap whatever
    //   the plugins above have already contributed to the session.
    customSession(async ({ user, session }, ctx) => {
      // Refreshes the Rails token when it is close to expiring, so `accessToken` can stay a
      //   plain field on the session.
      const result = await getAccessToken({
        ...ctx,
        method: "POST",
        body: { providerId: WCA_PROVIDER_ID, userId: user.id },
        asResponse: false,
        returnHeaders: false,
      }).catch((error) => {
        console.error("[auth] could not resolve a WCA access token", {
          userId: user.id,
          error,
        });
        return null;
      });

      // Spreading `ctx` inherits the response-shaping flags `customSession` set for its own
      //   `getSession` call, and they beat the ones passed above, so this comes back as a
      //   `{ response }` envelope. Unwrap on the key rather than on flags we do not control.
      const tokens = (
        result && "response" in result ? result.response : result
      ) as { accessToken?: string } | null;

      return {
        user,
        session,
        accessToken: tokens?.accessToken,
      };
    }, siteAuthOptions),
  ],
});

type RawSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export type Session = NonNullable<RawSession> & { accessToken: string };

/**
 * A session whose token could not be refreshed is reported as no session: the refresh token is
 * spent and Rails will reject us, so a fresh login is the only way on. Collapsing the two cases
 * lets call sites keep one `if (!session)` guard and treat `accessToken` as always present.
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.accessToken) {
    return null;
  }

  return session as Session;
}
