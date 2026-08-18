import { signOut, useSession } from "@/auth.client";
import { useMemo } from "react";
import { authenticatedClient, unauthenticatedClient } from "@/lib/wca/wcaAPI";
import createQueryClient from "openapi-react-query";

export function useAPIClient() {
  const { data: session } = useSession();

  return useMemo(() => {
    // A session without an access token means the refresh token is spent, so there is nothing
    //   to authenticate with — fall back to the unauthenticated client rather than sending a
    //   `Bearer undefined` the backend would reject.
    if (session?.accessToken) {
      const client = authenticatedClient(session.accessToken);

      // If the backend rejects our access_token (revoked, expired, etc.),
      // the session is no longer usable —
      // drop it so the user is forced through a fresh login rather than
      // continuing to fire requests that 401.
      client.use({
        onResponse({ response }) {
          if (response.status === 401) {
            signOut();
          }
          return response;
        },
      });

      return client;
    } else {
      return unauthenticatedClient;
    }
  }, [session]);
}

export default function useAPI() {
  const apiClient = useAPIClient();

  return useMemo(() => createQueryClient(apiClient), [apiClient]);
}
