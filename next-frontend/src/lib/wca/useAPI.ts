import { signOut, useSession } from "next-auth/react";
import { useMemo } from "react";
import { authenticatedClient, unauthenticatedClient } from "@/lib/wca/wcaAPI";
import createQueryClient from "openapi-react-query";

export function useAPIClient() {
  const { data: session } = useSession();

  return useMemo(() => {
    if (!session) {
      return unauthenticatedClient;
    }

    const client = authenticatedClient(session.accessToken);

    // If the backend rejects our access_token (revoked, expired beyond the
    // refresh-token grace window, etc.), the session is no longer usable —
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
  }, [session]);
}

export default function useAPI() {
  const apiClient = useAPIClient();

  return useMemo(() => createQueryClient(apiClient), [apiClient]);
}
