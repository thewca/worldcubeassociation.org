import type { NextAuthConfig } from "next-auth";
import { EnrichedAuthConfig, PayloadAuthjsUser } from "payload-authjs";
import { Provider } from "@auth/core/providers";
import type { User as PayloadUser } from "@/types/payload";

export const WCA_PROVIDER_ID = "WCA";
export const WCA_CMS_PROVIDER_ID = `${WCA_PROVIDER_ID}-CMS`;

const baseWcaProvider: Provider = {
  id: WCA_PROVIDER_ID,
  name: "WCA-OIDC-Provider",
  type: "oidc",
  issuer: process.env.OIDC_ISSUER,
  clientId: process.env.OIDC_CLIENT_ID,
  clientSecret: process.env.OIDC_CLIENT_SECRET,
  profile: (profile) => {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      // The OIDC claim standard calls it `picture`,
      //   but for unknown reasons AuthJS v5 calls it `image`
      image: profile.picture,
      roles: profile.roles,
      wcaId: profile.preferred_username,
    };
  },
};

const cmsWcaProvider: Provider = {
  ...baseWcaProvider,
  id: WCA_CMS_PROVIDER_ID,
  name: "WCA-OIDC-Provider with CMS access",
  authorization: {
    params: { scope: "openid profile email cms" },
  },
  // Hit the user_info endpoint separately for roles computation
  idToken: false,
  // allow re-linking of accounts that have the same email.
  //   This happens when a user who is allowed to use Payload
  //   First logs in via the "normal" provider, and later wants to "switch"
  //   to using Payload via the CMS provider.
  // See https://authjs.dev/concepts#security for details. Quote:
  //   > Examples of scenarios where this is secure include an OAuth provider you control [...]
  allowDangerousEmailAccountLinking: true,
};

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [baseWcaProvider],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        // First-time login, save the `access_token`, its expiry and the `refresh_token`
        return {
          ...token,
          wcaId: user?.wcaId,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
        };
      } else if (Date.now() < (token.expires_at as number) * 1000) {
        // Subsequent logins, but the `access_token` is still valid
        return token;
      } else {
        // TODO Implement Refreshing
        return token;
      }
    },
    async session({ session, token }) {
      // @ts-expect-error TODO: Fix this
      session.accessToken = token.access_token;
      session.user.wcaId = token.wcaId as string;
      return session;
    },
  },
};

declare module "@auth/core/types" {
  interface User extends PayloadAuthjsUser<PayloadUser> {
    wcaId?: string;
  }
}

export const payloadAuthConfig: EnrichedAuthConfig = {
  ...authConfig,
  providers: [cmsWcaProvider],
  basePath: "/api/auth/payload",
  cookies: {
    sessionToken: {
      name: "authjs.admin.session-token",
    },
    csrfToken: {
      name: "authjs.admin.csrf-token",
    },
    callbackUrl: {
      name: "authjs.admin.callback-url",
    },
  },
  events: {
    signIn: async ({ user, payload }) => {
      if (!user.id || !payload) {
        return;
      }

      await payload.update({
        collection: "users",
        id: user.id,
        data: {
          roles: user.roles,
          image: user.image,
        },
      });
    },
  },
};
