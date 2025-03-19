"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { usePermissions } from "@/providers/PermissionProvider";
import { Button, Code, Container, Text, Link as ChakraLink, HStack } from "@chakra-ui/react";
import Link from "next/link";

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
        <Button onClick={() => signIn("WCA")} colorPalette="blue">Sign in</Button>
      )}
      <Text>Test Links:</Text>
      <HStack>
      <ChakraLink asChild variant="plainLink">
        <Link href="competitions/OC2024">
          <Button variant="outline">OC2024</Button>
        </Link>
      </ChakraLink>
      <ChakraLink asChild variant="plainLink">
        <Link href="competitions/WC2025">
          <Button variant="outline" colorPalette="red">WC2025</Button>
        </Link>
      </ChakraLink>
      <ChakraLink asChild variant="plainLink">
        <Link href="persons/2022ANDE01">
          <Button variant="outline" colorPalette="red">2022ANDE01</Button>
        </Link>
      </ChakraLink>
      </HStack>
    </Container>
  );
}
