import { HStack, Heading, Tabs, Text, VStack } from "@chakra-ui/react";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";
import { serverClient } from "@/lib/wca/wcaAPI";
import OpenapiError from "@/components/ui/openapiError";
import LiveCompetitionsTable from "./LiveCompetitionsTable";
import LiveCompetitionSearch from "./LiveCompetitionSearch";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("competitions.live.title"),
  };
}

export default async function LiveCompetitionsPage() {
  const { t } = await getT();

  const {
    data: liveCompetitions,
    error,
    response,
  } = await serverClient.GET("/v1/competitions/live");

  if (error) return <OpenapiError response={response} t={t} />;

  const { upcoming, in_progress: inProgress, past } = liveCompetitions;

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
