"use client";

import {
  Card,
  GridItem,
  SimpleGrid,
  Pagination,
  IconButton,
} from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import { useState } from "react";
import formats from "@/lib/wca/data/formats";
import { LiveCompetitor, LiveResult } from "@/types/live";
import AttemptsForm from "@/components/live/AttemptsForm";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import events from "@/lib/wca/data/events";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export default function DoubleCheck({
  results,
  roundWcifId,
  formatId,
}: {
  results: LiveResult[];
  roundWcifId: string;
  competitionId: string;
  formatId: string;
}) {
  const format = formats.byId[formatId];
  const solveCount = format.expected_solve_count;

  const { eventId, roundNumber } = parseActivityCode(roundWcifId);

  const [currentIndex, setCurrentIndex] = useState(0);

  const { isPending, handleRegistrationIdChange } = useResultsAdmin();

  const onPageChange = (details: { page: number }) => {
    const newIndex = details.page - 1; // Chakra's page is 1-indexed
    handleRegistrationIdChange(results[newIndex].registration_id);
    setCurrentIndex(newIndex);
  };

  return (
    <Pagination.Root
      count={results.length}
      pageSize={1}
      page={currentIndex + 1}
      onPageChange={onPageChange}
    >
      <SimpleGrid columns={16} gap="6">
        <GridItem
          colSpan={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Pagination.PrevTrigger asChild>
            <IconButton>
              <LuChevronLeft />
            </IconButton>
          </Pagination.PrevTrigger>
        </GridItem>

        <GridItem colSpan={7}>
          {isPending ? (
            <Loading />
          ) : (
            <AttemptsForm
              header="Double Check Result"
              solveCount={solveCount}
              eventId={eventId}
            />
          )}
        </GridItem>

        <GridItem
          colSpan={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Pagination.NextTrigger asChild>
            <IconButton>
              <LuChevronRight />
            </IconButton>
          </Pagination.NextTrigger>
        </GridItem>

        <GridItem colSpan={7} textAlign="center" verticalAlign="middle">
          <Card.Root height="full" variant="outline">
            <Card.Body>
              <Card.Header textAlign="center">
                <Pagination.PageText />
                <br />
                {events.byId[eventId].name} - {roundNumber}
              </Card.Header>
              <Card.Title>Double-check</Card.Title>
              <Card.Description>
                Here you can iterate over results ordered by entry time (newest
                first). When doing double-check you can place a scorecard next
                to the form to quickly compare attempt results. For optimal
                experience make sure to always put entered/updated scorecard at
                the top of the pile.
              </Card.Description>
            </Card.Body>
          </Card.Root>
        </GridItem>
      </SimpleGrid>
    </Pagination.Root>
  );
}
