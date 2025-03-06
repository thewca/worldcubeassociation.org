"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import {useState} from "react";
import getPermissions from "@/lib/wca/users/permissions";

export default function Home() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);

  return (
    <div>
      {session ? (
        <>
          <p>Welcome, {session.user?.name}</p>
          <button onClick={() => signOut()}>Sign out</button>
          <button onClick={async () => setResult(await getPermissions(session.accessToken))}>Do an API Request</button>
          {result && JSON.stringify(result, null, 2)}
        </>
      ) : (
        <button onClick={() => signIn("WCA")}>Sign in</button>
      )}
    </div>
  );
}
