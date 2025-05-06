"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { usePermissions } from "@/providers/PermissionProvider";
import {
  Button,
  Code,
  Container,
  Text,
  Link as ChakraLink,
  HStack,
  Card,
  SimpleGrid,
  Box,
} from "@chakra-ui/react";
import Link from "next/link";

import { iconMap, IconName } from "@/components/icons/iconMap";

export default function Home() {
  const { data: session } = useSession();
  const permissions = usePermissions();

  return (
    <Container centerContent gap="3">
      {session ? (
        <>
          <Text>Welcome, {session.user?.name}</Text>
          <Button onClick={() => signOut()}>Sign out</Button>
          {permissions && (
            <Code as="pre">{JSON.stringify(permissions, null, 2)}</Code>
          )}
        </>
      ) : (
        <Button onClick={() => signIn("WCA")} colorPalette="blue">
          Sign in
        </Button>
      )}
      <Text>Test Links:</Text>
      <HStack>
        <ChakraLink asChild variant="colouredLink" colorPalette="blue">
          <Link href="competitions/OC2024">
            <Button variant="outline">OC2024</Button>
          </Link>
        </ChakraLink>
        <ChakraLink asChild variant="colouredLink" colorPalette="red">
          <Link href="competitions/WC2025">
            <Button variant="outline" colorPalette="red">
              WC2025
            </Button>
          </Link>
        </ChakraLink>
        <ChakraLink asChild variant="colouredLink" colorPalette="red">
          <Link href="persons/2022ANDE01">
            <Button variant="outline" colorPalette="red">
              2022ANDE01
            </Button>
          </Link>
        </ChakraLink>
      </HStack>
      <Card.Root>
        <Card.Body>
          <Box mb="4">
            <Text fontSize="xl" fontWeight="bold">
              WCA Icon Gallery
            </Text>
          </Box>
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing={6}>
            {(Object.entries(iconMap) as [IconName, React.ComponentType][]).map(
              ([iconName, IconComponent], index) => (
                <Box textAlign="center" key={index}>
                  <IconComponent w="6" h="6" />
                  <Text mt="2" fontSize="sm">
                    {iconName}
                  </Text>
                </Box>
              ),
            )}
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
    </Container>
  );
}
