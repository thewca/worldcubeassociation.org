"use client";

import { usePathname } from "next/navigation";
import _ from "lodash";
import { activityCodeFromPath } from "./TabMenu";
import { useT } from "@/lib/i18n/useI18n";
import { Box, Breadcrumb, Heading, Icon, Stack, Text } from "@chakra-ui/react";
import { components } from "@/types/openapi";
import { LuHouse } from "react-icons/lu";
import { route } from "nextjs-routes";
import { CompetitionNavTab } from "@/lib/wca/competitions/tabs";

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
    <Breadcrumb.Root hideFrom="md">
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

export default function Content({
  competition,
  children,
  tabs,
}: {
  competition: components["schemas"]["CompetitionInfo"];
  children: React.ReactNode;
  tabs: CompetitionNavTab[];
}) {
  console.log("tabs", tabs);
  const { t } = useT();
  const pathName = usePathname();
  const path = _.last(pathName.split("/"));
  const currentPath = path === competition.id ? "general" : path;

  const eventId =
    activityCodeFromPath(currentPath!) || decodeURIComponent(currentPath!);

  const headerKey = tabs.find((t) => t.menuKey === eventId)?.i18nKey;

  const tHeader = headerKey ? t(headerKey) : eventId;
  return (
    <>
      {eventId !== "general" && (
        <Stack gap={0} mb={2}>
          <BreadcrumbHeader
            page={tHeader}
            competitionName={competition.name}
            competitionId={competition.id}
          />
          <Box hideBelow="md">
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
              <Heading size="3xl" fontWeight="bold" textTransform="capitalize">
                {tHeader}
              </Heading>
            </Stack>
          </Box>
        </Stack>
      )}
      {children}
    </>
  );
}
