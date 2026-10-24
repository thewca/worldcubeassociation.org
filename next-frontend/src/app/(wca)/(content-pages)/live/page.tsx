import { HStack, Heading, Tabs, Text, VStack } from "@chakra-ui/react";
import { DateTime } from "luxon";
import _ from "lodash";
import { Metadata } from "next";
import { connection } from "next/server";
import { getT } from "@/lib/i18n/get18n";
import { serverClient } from "@/lib/wca/wcaAPI";
import { hasNotPassed } from "@/lib/wca/dates";
import { isInProgress } from "@/lib/wca/competitions/statusUtils";
import OpenapiError from "@/components/ui/openapiError";
import { components } from "@/types/openapi";
import LiveCompetitionsTable from "./LiveCompetitionsTable";
import LiveCompetitionSearch from "./LiveCompetitionSearch";

// Mirrors the WCA Live landing page, which lists everything from one month back.
const PAST_COMPETITIONS_LOOKBACK = { months: 1 };

// Get every competition in a single request.
const MAX_PER_PAGE = 1000;

type LiveStatus = "upcoming" | "inProgress" | "past";

const liveStatus = (
  competition: components["schemas"]["CompetitionIndex"],
): LiveStatus => {
  if (hasNotPassed(competition.start_date)) return "upcoming";
  if (isInProgress(competition)) return "inProgress";
  return "past";
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("competitions.live.title"),
  };
}

export default async function LiveCompetitionsPage() {
  await connection();
  const { t } = await getT();

  const lookbackDate = DateTime.now()
    .minus(PAST_COMPETITIONS_LOOKBACK)
    .toISODate();

  const {
    data: competitions,
    error,
    response,
  } = await serverClient.GET("/v0/competition_index", {
    params: {
      query: {
        scoretaking_software: "internal",
        ongoing_and_future: lookbackDate,
        sort: "start_date,end_date",
        per_page: MAX_PER_PAGE,
      },
    },
  });

  if (error) return <OpenapiError response={response} t={t} />;

  const competitionsByStatus = _.groupBy(competitions, liveStatus);

  const upcoming = competitionsByStatus.upcoming ?? [];
  const inProgress = competitionsByStatus.inProgress ?? [];
  const past = (competitionsByStatus.past ?? []).toReversed();

  return (
    <VStack align="stretch" gap="4" width="full">
      <HStack justifyContent="space-between" wrap="wrap" gap="4">
        <Heading size="5xl">{t("competitions.live.title")}</Heading>
        <LiveCompetitionSearch />
      </HStack>
      <Tabs.Root
        defaultValue={inProgress.length > 0 ? "inProgress" : "upcoming"}
        variant="enclosed"
        fitted
        lazyMount
      >
        <Tabs.List>
          <Tabs.Trigger value="upcoming">
            {t("competitions.live.overview.upcoming")}
          </Tabs.Trigger>
          {inProgress.length > 0 && (
            <Tabs.Trigger value="inProgress">
              {t("competitions.live.overview.in_progress")}
            </Tabs.Trigger>
          )}
          {past.length > 0 && (
            <Tabs.Trigger value="past">
              {t("competitions.live.overview.past_month")}
            </Tabs.Trigger>
          )}
        </Tabs.List>
        <Tabs.Content value="upcoming">
          {upcoming.length > 0 ? (
            <LiveCompetitionsTable competitions={upcoming} t={t} />
          ) : (
            <Text>{t("competitions.live.overview.no_upcoming")}</Text>
          )}
        </Tabs.Content>
        <Tabs.Content value="inProgress">
          <LiveCompetitionsTable competitions={inProgress} t={t} />
        </Tabs.Content>
        <Tabs.Content value="past">
          <LiveCompetitionsTable competitions={past} t={t} />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
}
