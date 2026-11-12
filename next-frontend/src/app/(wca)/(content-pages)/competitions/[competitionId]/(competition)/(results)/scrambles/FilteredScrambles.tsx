"use client";

import { useState } from "react";
import { components } from "@/types/openapi";
import { Accordion, Heading, Table, VStack } from "@chakra-ui/react";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";
import roundTypes from "@/lib/wca/data/roundTypes";

export default function FilteredScrambles({
  competitionInfo,
  resultsByEvent,
  isAdmin = false,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  resultsByEvent: Record<string, components["schemas"]["Scramble"][]>;
  isAdmin?: boolean;
}) {
  const [activeEventId, setActiveEventId] = useState<string>(
    competitionInfo.event_ids[0],
  );

  const { t } = useT();

  const scramblesByRoundFormat = _.groupBy(
    resultsByEvent[activeEventId],
    "round_type_id",
  );

  const orderedRounds = _.sortBy(
    _.keys(scramblesByRoundFormat),
    (roundType) => roundTypes.byId[roundType].rank,
  );

  return (
    <VStack align="left" gap={4}>
      <SingleEventSelector
        title=""
        selectedEvent={activeEventId}
        onEventClick={setActiveEventId}
        eventList={competitionInfo.event_ids}
      />
      <Accordion.Root
        defaultValue={["0"]}
        multiple
        variant="enclosed"
        key={activeEventId}
      >
        {_.map(orderedRounds, (roundFormat, index) => {
          const scramblesForRound = scramblesByRoundFormat[roundFormat];
          const scramblesByGroup = _.groupBy(scramblesForRound, "group_id");

          return (
            <Accordion.Item
              key={`${activeEventId}-${roundFormat}`}
              value={index.toString()}
            >
              <Accordion.ItemTrigger justifyContent="space-between">
                <Heading textStyle="s1">
                  {events.byId[activeEventId].name}{" "}
                  {t(`rounds.${roundFormat}.name`)}
                </Heading>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody>
                  <Table.ScrollArea>
                    <Table.Root>
                      <Table.Header>
                        <Table.Row>
                          {isAdmin && (
                            <Table.ColumnHeader>Edit</Table.ColumnHeader>
                          )}
                          <Table.ColumnHeader>Group</Table.ColumnHeader>
                          <Table.ColumnHeader>#</Table.ColumnHeader>
                          <Table.ColumnHeader>Scramble</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>

                      <Table.Body>
                        {Object.entries(scramblesByGroup).map(
                          ([groupId, groupScrambles]) =>
                            groupScrambles.map((scramble, index) => (
                              <Table.Row key={scramble.id}>
                                {isAdmin && <Table.Cell>EDIT</Table.Cell>}

                                {/* Only show group_id in the first row of the group */}
                                {index === 0 && (
                                  <Table.Cell
                                    rowSpan={groupScrambles.length}
                                    verticalAlign="top"
                                  >
                                    {groupId}
                                  </Table.Cell>
                                )}
                                <Table.Cell>
                                  {scramble.is_extra
                                    ? `Extra ${scramble.scramble_num}`
                                    : scramble.scramble_num}
                                </Table.Cell>
                                <Table.Cell>{scramble.scramble}</Table.Cell>
                              </Table.Row>
                            )),
                        )}
                      </Table.Body>
                    </Table.Root>
                  </Table.ScrollArea>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </VStack>
  );
}
