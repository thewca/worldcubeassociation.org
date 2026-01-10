import { auth } from "@/auth";
import getPermissions from "@/lib/wca/permissions";
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

import { iconMap } from "@/components/icons/iconMap";
import { route } from "nextjs-routes";
import AttemptResultField from "./AttemptResultField";
import {
  ColorSemanticTokenDoc,
  ColorTokenDoc,
} from "@/app/(wca)/dashboard/ThemeExplorer";

export default async function Dashboard() {
  const session = await auth();
  const permissions = await getPermissions();

  return (
    <Container centerContent gap="3">
      {session && (
        <>
          <Text>Welcome, {session.user?.name}</Text>
          {permissions && (
            <Code as="pre">{JSON.stringify(permissions, null, 2)}</Code>
          )}
        </>
      )}
      <Text>Test Links:</Text>
      <HStack>
        <ChakraLink asChild colorPalette="blue">
          <Link
            href={route({
              pathname: "/competitions/[competitionId]",
              query: { competitionId: "OC2024" },
            })}
          >
            <Button variant="outline">OC2024</Button>
          </Link>
        </ChakraLink>
        <ChakraLink asChild colorPalette="red">
          <Link
            href={route({
              pathname: "/competitions/[competitionId]",
              query: { competitionId: "OC2024" },
            })}
          >
            <Button variant="outline" colorPalette="red">
              WC2025
            </Button>
          </Link>
        </ChakraLink>
        <ChakraLink asChild colorPalette="red">
          <Link
            href={route({
              pathname: "/persons/[wcaId]",
              query: { wcaId: "2022ANDE01" },
            })}
          >
            <Button variant="outline" colorPalette="red">
              2022ANDE01
            </Button>
          </Link>
        </ChakraLink>
      </HStack>
      <AttemptResultField eventId="333" resultType="single" />
      <Card.Root>
        <Card.Body>
          <Box mb="4">
            <Text fontSize="xl" fontWeight="bold">
              WCA Icon Gallery
            </Text>
          </Box>
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }}>
            {Object.entries(iconMap).map(([iconName, IconComponent], index) => (
              <Box textAlign="center" key={index}>
                <IconComponent fontSize="1.5em" />
                <Text mt="2" fontSize="sm">
                  {iconName}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
      <Card.Root width="full">
        <Card.Body>
          <Card.Title>Theme Explorer</Card.Title>
          <Box>
            <ColorSemanticTokenDoc />
            <ColorTokenDoc />
          </Box>
        </Card.Body>
      </Card.Root>
    </Container>
  );
}
