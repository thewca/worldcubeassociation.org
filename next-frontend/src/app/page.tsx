"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import usePermissions from "@/lib/wca/users/usePermissions";

export default function Home() {
  const { data: session } = useSession();
  const permissions = usePermissions();

  return (
    <div>
      {session ? (
        <>
          <p>Welcome, {session.user?.name}</p>
          <button onClick={() => signOut()}>Sign out</button>
          {permissions && JSON.stringify(permissions, null, 2)}
        </>
      ) : (
        <button onClick={() => signIn("WCA")}>Sign in</button>
      )}
    </div>
  );
}
