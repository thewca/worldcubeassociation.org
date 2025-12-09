import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { authenticatedClient, unauthenticatedClient } from "@/lib/wca/wcaAPI";
import createQueryClient from "openapi-react-query";

export function useAPIClient() {
  const { data: session } = useSession();

  return useMemo(() => {
    if (session) {
      return authenticatedClient(session.accessToken);
    } else {
      return unauthenticatedClient;
    }
  }, [session]);
}

export default function useAPI() {
  const apiClient = useAPIClient();

  return useMemo(() => createQueryClient(apiClient), [apiClient]);
}
