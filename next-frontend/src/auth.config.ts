import type { NextAuthConfig } from "next-auth";
import { Provider } from "@auth/core/providers";
import createClient from "openapi-fetch";

export const WCA_PROVIDER_ID = "WCA";
export const WCA_CMS_PROVIDER_ID = `${WCA_PROVIDER_ID}-CMS`;

interface oauthClientSpec {
  "/oauth/token": {
    post: {
      requestBody: {
        content: {
          "application/x-www-form-urlencoded": {
            client_id: string;
            client_secret: string;
            grant_type: "refresh_token";
            refresh_token: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              access_token: string;
              token_type: string;
              expires_in: number;
              refresh_token: string;
              scope: string;
              created_at: number;
              id_token: string;
            };
          };
        };
      };
    };
  };
}

const refreshTokenClient = createClient<oauthClientSpec>({
  baseUrl: process.env.OIDC_ISSUER,
});

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
  idToken: false,
  profile: (profile) => {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      roles: profile.roles,
    };
  },
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
        // as per https://authjs.dev/guides/refresh-token-rotation
        if (!token.refresh_token) throw new TypeError("Missing refresh_token");

        try {
          const { data: newTokens, error } = await refreshTokenClient.POST(
            "/oauth/token",
            {
              body: {
                client_id: baseWcaProvider.clientId!,
                client_secret: baseWcaProvider.clientSecret!,
                grant_type: "refresh_token",
                refresh_token: token.refresh_token! as string,
              },
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            },
          );

          if (error) throw error;

          return {
            ...token,
            access_token: newTokens.access_token,
            expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
            refresh_token: newTokens.refresh_token,
          };
        } catch (error) {
          console.error("Error refreshing access_token", error);
          // If we fail to refresh the token, return an error so we can handle it on the page
          token.error = "RefreshTokenError";
          return token;
        }
      }
    },
    async session({ session, token }) {
      session.accessToken = token.access_token as string;
      session.user.id = token.userId as string;
      return session;
    },
  },
};

export const payloadAuthConfig: NextAuthConfig = {
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
};
