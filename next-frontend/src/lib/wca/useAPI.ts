import {useSession} from "next-auth/react";
import {useMemo} from "react";
import {authenticatedClient, unauthenticatedClient} from "@/lib/wca/wcaAPI";

export default function useAPI(){
  const { data: session } = useSession();

  return useMemo(() => {
    if (session) {
      return authenticatedClient(session.accessToken)
    } else {
      return unauthenticatedClient;
    }
  }, [session]);
}
