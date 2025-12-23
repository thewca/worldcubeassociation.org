"use client";

import { Fragment, useMemo, useState } from "react";
import { components } from "@/types/openapi";
import { Heading, Table, VStack } from "@chakra-ui/react";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";

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

  const scramblesByEvent = useMemo(
    () => _.groupBy(resultsByEvent[activeEventId], "round_type_id"),
    [activeEventId, resultsByEvent],
  );

  return (
    <VStack align="left" gap={4}>
      <SingleEventSelector
        title=""
        selectedEvent={activeEventId}
        onEventClick={setActiveEventId}
        eventList={competitionInfo.event_ids}
      />
      {_.map(scramblesByEvent, (scrambles, roundFormat) => {
        const scramblesByGroup = _.groupBy(scrambles, "group_id");

        return (
          <Fragment key={`${activeEventId}-${roundFormat}`}>
            <Heading size="2xl">
              {events.byId[activeEventId].name}{" "}
              {t(`rounds.${roundFormat}.name`)}
            </Heading>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  {isAdmin && <Table.ColumnHeader>Edit</Table.ColumnHeader>}
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
          </Fragment>
        );
      })}
    </VStack>
  );
}
