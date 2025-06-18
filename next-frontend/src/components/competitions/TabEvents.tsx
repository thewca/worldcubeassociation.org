import React from "react";
import { Card, Table, Text } from "@chakra-ui/react";
import { getEvents } from "@/lib/wca/competitions/wcif/getEvents";
import {
  advancementConditionToString,
  cutoffToString,
  getRoundTypeId,
  qualificationToString,
  timeLimitToString,
} from "@/lib/wca/wcif/rounds";

interface TabEventsProps {
  competitionId: string;
  forceQualifications?: boolean;
}

export default async function TabEvents({
  competitionId,
  forceQualifications = false,
}: TabEventsProps) {
  const { data: events, error } = await getEvents(competitionId);

  if (error) {
    return <Text>Error fetching competition events</Text>;
  }

  if (!events) {
    return <Text>Competition does not exist</Text>;
  }

  const showCutoff = events.some((event) =>
    event.rounds.some((round) => Boolean(round.cutoff)),
  );

  const showQualifications =
    forceQualifications || events.some((event) => Boolean(event.qualification));

  return (
    <Card.Root>
      <Card.Body>
        <Table.Root striped interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Event</Table.ColumnHeader>
              <Table.ColumnHeader>Round</Table.ColumnHeader>
              <Table.ColumnHeader>Format</Table.ColumnHeader>
              <Table.ColumnHeader>Time Limit</Table.ColumnHeader>
              {showCutoff && <Table.ColumnHeader>Cutoff</Table.ColumnHeader>}
              <Table.ColumnHeader>Proceed</Table.ColumnHeader>
              {showQualifications && (
                <Table.ColumnHeader>Qualification</Table.ColumnHeader>
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {events.map((event) =>
              event.rounds.map((round, idx) => (
                <Table.Row key={round.id}>
                  {idx === 0 && (
                    <Table.Cell rowSpan={event.rounds.length}>
                      {event.id}
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    {getRoundTypeId(
                      idx + 1,
                      event.rounds.length,
                      Boolean(round.cutoff),
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {round.cutoff && `${round.cutoff.numberOfAttempts} / `}
                    {round.format}
                  </Table.Cell>
                  <Table.Cell>
                    {timeLimitToString(round.timeLimit, event.id, events)}
                  </Table.Cell>
                  {showCutoff && (
                    <Table.Cell>
                      {round.cutoff && cutoffToString(round.cutoff, event.id)}
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    {round.advancementCondition &&
                      advancementConditionToString(
                        round.advancementCondition,
                        event.id,
                        round.format,
                      )}
                  </Table.Cell>
                  {showQualifications && (
                    <Table.Cell>
                      {idx === 0 && (
                        <>
                          {event.qualification
                            ? qualificationToString(
                                event.qualification,
                                event.id,
                              )
                            : "-"}
                        </>
                      )}
                    </Table.Cell>
                  )}
                </Table.Row>
              )),
            )}
          </Table.Body>
        </Table.Root>
      </Card.Body>
      <Card.Footer>Explanations about what &#34;Cutoff&#34; means</Card.Footer>
    </Card.Root>
  );
}
