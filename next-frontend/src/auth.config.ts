import type { NextAuthConfig } from "next-auth";
import { Provider } from "@auth/core/providers";

export const WCA_PROVIDER_ID = "WCA";
export const WCA_CMS_PROVIDER_ID = `${WCA_PROVIDER_ID}-CMS`;

const baseWcaProvider: Provider = {
  id: WCA_PROVIDER_ID,
  name: "WCA-OIDC-Provider",
  type: "oidc",
  issuer: process.env.OIDC_ISSUER,
  clientId: process.env.OIDC_CLIENT_ID,
  clientSecret: process.env.OIDC_CLIENT_SECRET,
};

const cmsWcaProvider: Provider = {
  ...baseWcaProvider,
  id: WCA_CMS_PROVIDER_ID,
  name: "WCA-OIDC-Provider with CMS access",
  authorization: {
    params: { scope: "openid profile email cms" },
  },
  profile: (profile) => {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      roles: profile.roles,
    };
  },
};

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [baseWcaProvider, cmsWcaProvider],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // First-time login, save the `access_token`, its expiry and the `refresh_token`
        return {
          ...token,
          userId: account.userId,
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
      session.user.id = token.userId as string;
      return session;
    },
  },
};

export const payloadAuthConfig: NextAuthConfig = {
  ...authConfig,
  providers: [cmsWcaProvider],
};
