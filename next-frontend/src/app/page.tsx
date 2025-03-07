"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useState } from "react";
import useAPI from "@/lib/wca/useAPI";

export default function Home() {
  const { data: session } = useSession();
  const [result, setResult] = useState<unknown>(null);
  const api = useAPI();

  const doAPIRequest = useCallback(async () => {
    const { data } = await api.GET("/users/me/permissions");
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
