import { Button, Heading, Link, Stack } from "@chakra-ui/react";
import WcaDocsIcon from "../icons/WcaDocsIcon";

export default function PageContent({
  eventId,
  currentPath,
  competitionId,
  children,
}: {
  eventId: string;
  currentPath: string;
  competitionId: string;
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
        <Heading size="3xl" fontWeight="bold">
          {(eventId === "general" ? "Info" : eventId || "").toUpperCase()}
        </Heading>
        {currentPath === "schedule" && (
          <Button variant="outline" size="xs" asChild>
            <Link
              href={
                "https://www.worldcubeassociation.org/competitions/" +
                competitionId +
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
