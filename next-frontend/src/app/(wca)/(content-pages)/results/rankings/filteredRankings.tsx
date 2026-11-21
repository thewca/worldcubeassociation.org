"use client";

import React, { useMemo, useTransition } from "react";
import { Heading, Tabs, VStack } from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import { RankingsFilterBox } from "@/components/results/FilterBox";
import { useT } from "@/lib/i18n/useI18n";
import { getMediumDateString } from "@/lib/wca/dates";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import RankingsTable from "@/components/results/RankingsTable";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";
import { components } from "@/types/openapi";
import type { RankingsFilters } from "@/lib/wca/results/types";

function createUrl(params: RankingsFilters) {
  const { event, region, gender, show, rankingType } = params;
  return route({
    pathname: "/results/rankings",
    query: { event_id: event, region, gender, show, type: rankingType },
  });
}

interface FilteredRecordsProps {
  rankings: components["schemas"]["ExtendedResult"][];
  timestamp: string;
  searchParams: RankingsFilters;
}

export default function FilteredRecords({
  rankings,
  timestamp,
  searchParams,
}: FilteredRecordsProps) {
  const router = useRouter();
  // Navigating inside a transition lets us show a progress bar while the server
  // re-renders the table with the new filters
  const [isPending, startTransition] = useTransition();

  const { event, region, gender, show, rankingType } = searchParams;

  const filterActions = useMemo(() => {
    const navigate = (params: Partial<RankingsFilters>) =>
      startTransition(() =>
        router.replace(
          createUrl({ event, region, gender, show, rankingType, ...params }),
        ),
      );

    return {
      setEvent: (event: string) =>
        navigate(
          event === "333mbf" ? { event, rankingType: "single" } : { event },
        ),
      setRegion: (region: string) => navigate({ region }),
      setGender: (gender: string) => navigate({ gender }),
      setShow: (show: string) => navigate({ show }),
      setType: (rankingType: string) => navigate({ rankingType }),
    };
  }, [event, gender, rankingType, region, router, show]);

  const { t } = useT();
  const lng = useLocale();

  return (
    <VStack align="left" gap={2}>
      <Heading size={{ base: "3xl", md: "5xl" }}>
        {t("results.rankings.title")}
      </Heading>
      {t("results.last_updated_html", {
        timestamp: getMediumDateString(timestamp, lng),
      })}
      <Tabs.Root
        value={show}
        onValueChange={({ value }) => filterActions.setShow(value)}
        variant="line"
        width="full"
      >
        <Tabs.List aria-label={t("results.rankings.title")}>
          <Tabs.Trigger value="100 persons">
            {t("results.selector_elements.show_selector.persons")}
          </Tabs.Trigger>
          <Tabs.Trigger value="100 results">
            {t("results.selector_elements.show_selector.results")}
          </Tabs.Trigger>
          <Tabs.Trigger value="by region">
            {t("results.selector_elements.show_selector.by_region")}
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
      <RankingsFilterBox
        filterState={searchParams}
        filterActions={filterActions}
      />
      {/* The same indeterminate bar the router shows for a normal navigation, so
          filtering here feels like filtering anywhere else on the site. */}
      {isPending && <Loading />}
      <RankingsTable
        rankings={rankings}
        isAverage={rankingType === "average"}
        isByRegion={show === "by region"}
      />
    </VStack>
  );
}
