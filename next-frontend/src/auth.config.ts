import { NextAuthConfig } from "next-auth";
import { getSecret } from "@/vault";

export const authConfig: NextAuthConfig = {
  secret: await getSecret("AUTH_SECRET"),
  providers: [
    {
      id: "WCA",
      name: "WCA-OIDC-Provider",
      type: "oidc",
      issuer: process.env.OIDC_ISSUER,
      clientId: await getSecret("OIDC_CLIENT_ID"),
      clientSecret: await getSecret("OIDC_CLIENT_SECRET"),
    },
  ],
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
