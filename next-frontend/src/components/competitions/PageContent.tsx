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

const BY_PERSON_PAGE_ID = "by-person";
const COMPETITOR_RESULT_PAGE_ID = "competitor_results";

// Matches ".../live/competitors/<registrationId>"
const COMPETITOR_RESULT_PATH = /\/live\/competitors\/[^/]+\/?$/;

export function pageIdFromPath(pathname: string, fullPath: string): string {
  if (COMPETITOR_RESULT_PATH.test(fullPath)) {
    return COMPETITOR_RESULT_PAGE_ID;
  }

  // Handled separately because activityCodeFromPath would cut "by-person" down to "by"
  if (pathname === BY_PERSON_PAGE_ID) {
    return BY_PERSON_PAGE_ID;
  }

  return activityCodeFromPath(pathname) ?? decodeURIComponent(pathname);
}

export function getTabTranslation(pageId: string, tabs: CompetitionNavTab[]) {
  // i18n-tasks-use t('competitions.nav.menu.competitor_results')
  if (pageId === COMPETITOR_RESULT_PAGE_ID) {
    return "competitions.nav.menu.competitor_results";
  }

  return _.get(_.find(tabs, { menuKey: pageId }), "i18nKey");
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
  const { t } = useT();
  const pathName = usePathname();
  const path = _.last(pathName.split("/")) || "";
  const currentPath = path === competition.id ? "general" : path;

  const pageId = pageIdFromPath(currentPath, pathName);

  const headerKey = getTabTranslation(pageId, tabs);

  const tHeader = headerKey ? t(headerKey) : pageId;
  return (
    <>
      {pageId !== "general" && (
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
