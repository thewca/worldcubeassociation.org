"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useState } from "react";
import { authenticatedClient } from "@/lib/wca/wcaAPI";

export default function Home() {
  const { data: session } = useSession();
  const [result, setResult] = useState<unknown>(null);

  const doAPIRequest = useCallback(async () => {
    const apiClient = authenticatedClient(session?.accessToken);
    const { data } = await apiClient.GET("/users/me/permissions");
    setResult(data);
  }, [session])

  return (
    <div>
      {session ? (
        <>
          <p>Welcome, {session.user?.name}</p>
          <button onClick={() => signOut()}>Sign out</button>
          <button onClick={doAPIRequest}>Do an API Request</button>
          {result && JSON.stringify(result, null, 2)}
        </>
      ) : (
        <button onClick={() => signIn("WCA")}>Sign in</button>
      )}
    </div>
  );
}
