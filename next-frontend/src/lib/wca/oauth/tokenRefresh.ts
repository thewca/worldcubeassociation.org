import { cache } from "react";
import createClient from "openapi-fetch";
import {
  WCA_OIDC_CLIENT_ID,
  WCA_OIDC_CLIENT_SECRET,
  WCA_OIDC_ISSUER,
} from "@/lib/wca/oauth/config";

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
  baseUrl: WCA_OIDC_ISSUER,
});

export const refreshToken = cache(async (refreshToken: string) => {
  return await refreshTokenClient.POST("/oauth/token", {
    body: {
      client_id: WCA_OIDC_CLIENT_ID,
      client_secret: WCA_OIDC_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
});
