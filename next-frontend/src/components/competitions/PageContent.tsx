import { Button, Heading, Link, Stack, Text } from "@chakra-ui/react";
import WcaDocsIcon from "../icons/WcaDocsIcon";
import { components } from "@/types/openapi";

export default function PageContent({
  eventId,
  currentPath,
  competition,
  children,
}: {
  eventId: string;
  currentPath: string;
  competition: components["schemas"]["CompetitionInfo"];
  children: React.ReactNode;
}) {
  return (
    <>
      <Stack
        direction="row"
        justifyContent="start"
        alignItems="center"
        mb={2}
        gap={3}
      >
        {eventId !== "general" && (
          <Stack gap={0}>
            <Text color="fg.muted" fontSize="xs">
              {competition.name}
            </Text>
            <Heading size="3xl" fontWeight="bold" textTransform="capitalize">
              {eventId}
            </Heading>
          </Stack>
        )}
        {currentPath === "schedule" && (
          <Button variant="outline" size="xs" asChild>
            <Link
              href={
                "https://www.worldcubeassociation.org/competitions/" +
                competition.id +
                ".pdf"
              }
              color="inherit"
              textDecoration="none"
            >
              <WcaDocsIcon /> Download
            </Link>
          </Button>
        )}
      </Stack>
      {children}
    </>
  );
}
