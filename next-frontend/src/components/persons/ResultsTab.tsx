"use client";
import React, { useState } from "react";
import { Box, Text, VStack } from "@chakra-ui/react";
import { useOnInView } from "react-intersection-observer";
import useAPI from "@/lib/wca/useAPI";
import { ByCompetitionTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";
import Loading from "@/components/ui/loading";

const COMPETITIONS_PER_PAGE = 50;

interface ResultsTabProps {
  wcaId: string;
  eventsWithResults: string[];
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  wcaId,
  eventsWithResults,
}) => {
  const [eventId, setEventId] = useState(eventsWithResults[0]);

  return (
    <VStack>
      <SingleEventSelector
        title=""
        selectedEvent={eventId}
        onEventClick={setEventId}
        eventList={eventsWithResults}
        eventButtonsCompact
      />
      <Results wcaId={wcaId} eventId={eventId} />
    </VStack>
  );
};

const Results: React.FC<{ wcaId: string; eventId: string }> = ({
  wcaId,
  eventId,
}) => {
  const api = useAPI();
  const { t } = useT();

  const {
    data: resultsQuery,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = api.useInfiniteQuery(
    "get",
    "/v1/persons/{wca_id}/results",
    {
      params: {
        path: { wca_id: wcaId },
        query: { event_id: eventId, per_page: COMPETITIONS_PER_PAGE },
      },
    },
    {
      pageParamName: "page",
      getNextPageParam: (previousPage, allPages) => {
        // Pages are cut by competition, so a page with fewer competitions than requested is the last one.
        const competitionCount = new Set(
          previousPage.map((result) => result.competition_id),
        ).size;

        if (competitionCount < COMPETITIONS_PER_PAGE) {
          return undefined;
        }
        return allPages.length + 1;
      },
      initialPageParam: 1,
    },
  );

  const bottomRef = useOnInView((inView) => {
    if (inView) {
      fetchNextPage();
    }
  });

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!resultsQuery) {
    return <Text>Failed fetching results</Text>;
  }

  const loadedResults = resultsQuery.pages.flat();

  return (
    <>
      <ByCompetitionTable results={loadedResults} t={t} />
      {isFetchingNextPage ? (
        <Box width="full">
          <Loading />
        </Box>
      ) : (
        hasNextPage && <Box ref={bottomRef} />
      )}
    </>
  );
};

export default ResultsTab;
