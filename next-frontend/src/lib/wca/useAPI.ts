import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { authenticatedClient, unauthenticatedClient } from "@/lib/wca/wcaAPI";

export default function useAPI(v1: boolean = false) {
  const { data: session } = useSession();

  return useMemo(() => {
    if (false) {
      // @ts-expect-error TODO: Fix this
      return authenticatedClient(session.accessToken);
    } else {
      return unauthenticatedClient(v1);
    }
  }, [session, v1]);
}
