"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { usePermissions } from "@/providers/PermissionProvider";
import { Button, Code, Container, Text } from "@chakra-ui/react";

export default function Home() {
  const { data: session } = useSession();
  const permissions = usePermissions();

  return (
    <Container centerContent>
      {session ? (
        <>
          <Text>Welcome, {session.user?.name}</Text>
          <Button onClick={() => signOut()}>Sign out</Button>
          {permissions && (
            <Code as="pre">{JSON.stringify(permissions, null, 2)}</Code>
          )}
        </>
      ) : (
        <Button onClick={() => signIn("WCA")}>Sign in</Button>
      )}
    </Container>
  );
}
