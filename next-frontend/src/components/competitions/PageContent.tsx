import {
  Breadcrumb,
  Heading,
  Icon,
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { components } from "@/types/openapi";
import { LuHouse } from "react-icons/lu";
import { route } from "nextjs-routes";

export default function PageContent({
  eventId,
  competition,
  children,
}: {
  eventId: string;
  currentPath: string;
  competition: components["schemas"]["CompetitionInfo"];
  children: React.ReactNode;
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  return (
    <>
      {eventId !== "general" && (
        <Stack gap={0} mb={2}>
          {isMobile ? (
            <BreadcrumbHeader
              page={eventId}
              competitionName={competition.name}
              competitionId={competition.id}
            />
          ) : (
            <>
              <Text color="fg.muted" fontSize="xs">
                {competition.name}
              </Text>
              <Stack
                direction="row"
                justifyContent="start"
                alignItems="center"
                mb={2}
                gap={3}
              >
                <Heading
                  size="3xl"
                  fontWeight="bold"
                  textTransform="capitalize"
                >
                  {eventId}
                </Heading>
                {/* {currentPath === "schedule" && (
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
            )} */}
              </Stack>
            </>
          )}
        </Stack>
      )}
      {children}
    </>
  );
}

function BreadcrumbHeader({
  page,
  competitionName,
  competitionId,
}: {
  page: string;
  competitionName: string;
  competitionId: string;
}) {
  return (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link
            href={route({
              pathname: "/competitions/[competitionId]",
              query: { competitionId: competitionId },
            })}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <Icon mb={0.5}>
                <LuHouse size={14} />
              </Icon>
              {competitionName}
            </Stack>
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item textTransform="capitalize">{page}</Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
