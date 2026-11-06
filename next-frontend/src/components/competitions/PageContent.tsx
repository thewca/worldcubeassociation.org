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
import { CompetitionNavTab } from "@/lib/wca/competitions/tabs";
import { useT } from "@/lib/i18n/useI18n";

export default function PageContent({
  eventId,
  competition,
  children,
  tabs,
}: {
  eventId: string;
  competition: components["schemas"]["CompetitionInfo"];
  children: React.ReactNode;
  tabs: CompetitionNavTab[];
}) {
  const { t } = useT();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const headerKey = tabs.find((t) => t.menuKey === eventId)?.i18nKey;

  const tHeader = headerKey ? t(headerKey) : eventId;

  return (
    <>
      {eventId !== "general" && (
        <Stack gap={0} mb={2}>
          {isMobile ? (
            <BreadcrumbHeader
              page={tHeader}
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
                  {tHeader}
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
      <Breadcrumb.List flexWrap="nowrap">
        <Breadcrumb.Item flexShrink={0}>
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
        <Breadcrumb.Separator flexShrink={0} />
        <Breadcrumb.Item minW={0} textTransform="capitalize">
          <Text as="span" truncate title={page}>
            {page}
          </Text>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
