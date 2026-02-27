"use client";

import { Button, Card, GridItem, SimpleGrid } from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import { useState } from "react";
import formats from "@/lib/wca/data/formats";
import { LiveCompetitor, LiveResult } from "@/types/live";
import AttemptsForm from "@/components/live/AttemptsForm";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import events from "@/lib/wca/data/events";

export default function DoubleCheck({
  competitors,
  results,
  roundWcifId,
  formatId,
}: {
  results: LiveResult[];
  roundWcifId: string;
  competitionId: string;
  competitors: LiveCompetitor[];
  formatId: string;
}) {
  const format = formats.byId[formatId];
  const solveCount = format.expected_solve_count;

  const { eventId, roundNumber } = parseActivityCode(roundWcifId);

  const [currentIndex, setCurrentIndex] = useState(0);

  const { isPendingUpdate, handleRegistrationIdChange } = useResultsAdmin();

  const onPrevious = () => {
    handleRegistrationIdChange(results[currentIndex - 1].registration_id);
    setCurrentIndex((oldIndex) => oldIndex - 1);
  };

  const onNext = () => {
    handleRegistrationIdChange(results[currentIndex + 1].registration_id);
    setCurrentIndex((oldIndex) => oldIndex + 1);
  };

  return (
    <SimpleGrid columns={16} gap="6">
      <GridItem colSpan={1} verticalAlign="middle">
        {currentIndex !== 0 && <Button onClick={onPrevious}>{"<"}</Button>}
      </GridItem>
      <GridItem colSpan={7}>
        {isPendingUpdate ? (
          <Loading />
        ) : (
          <AttemptsForm
            header="Double Check Result"
            competitors={competitors}
            solveCount={solveCount}
            eventId={eventId}
          />
        )}
      </GridItem>
      <GridItem colSpan={1} verticalAlign="middle">
        {currentIndex !== results.length - 1 && (
          <Button onClick={onNext}>{">"}</Button>
        )}
      </GridItem>
      <GridItem colSpan={7} textAlign="center" verticalAlign="middle">
        <Card.Root height="full" variant="outline">
          <Card.Body>
            <Card.Header textAlign="center">
              {currentIndex + 1} of {results.length}
              <br />
              {events.byId[eventId].name} - {roundNumber}
            </Card.Header>
            <Card.Title>Double-check</Card.Title>
            <Card.Description>
              Here you can iterate over results ordered by entry time (newest
              first). When doing double-check you can place a scorecard next to
              the form to quickly compare attempt results. For optimal
              experience make sure to always put entered/updated scorecard at
              the top of the pile.
            </Card.Description>
          </Card.Body>
        </Card.Root>
      </GridItem>
    </SimpleGrid>
  );
}
