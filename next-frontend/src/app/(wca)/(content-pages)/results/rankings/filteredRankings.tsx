"use client";

import React, { useMemo, useTransition } from "react";
import { Heading, VStack } from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import { RankingsFilterBox } from "@/components/results/FilterBox";
import { useT } from "@/lib/i18n/useI18n";
import { getMediumDateString } from "@/lib/wca/dates";
import RankingsTable from "@/components/results/RankingsTable";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";
import { components } from "@/types/openapi";

type FilterParams = {
  event: string;
  region: string;
  gender: string;
  show: string;
  rankingType: string;
};

function createUrl(params: FilterParams) {
  const { event, region, gender, show, rankingType } = params;
  return route({
    pathname: "/results/rankings",
    query: { event_id: event, region, gender, show, type: rankingType },
  });
}

interface FilteredRecordsProps {
  rankings: components["schemas"]["ExtendedResult"][];
  timestamp: string;
  searchParams: FilterParams;
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
    const navigate = (params: Partial<FilterParams>) =>
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

  return (
    <VStack align="left" gap={2}>
      <Heading size={{ base: "3xl", md: "5xl" }}>
        {t("results.rankings.title")}
      </Heading>
      {t("results.last_updated_html", {
        timestamp: getMediumDateString(timestamp),
      })}
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
