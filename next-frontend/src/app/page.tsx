"use client";

import { useSession } from "next-auth/react";
import { signIn, signOut } from "@/auth";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? (
        <>
          <p>Welcome, {session.user?.name}</p>
          <button onClick={() => signOut()}>Sign out</button>
        </>
      ) : (
        <button onClick={() => signIn("WCA")}>Sign in</button>
      )}
    </div>
  );
}
