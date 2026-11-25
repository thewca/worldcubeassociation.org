import React from "react";
import { Card, Table, Text } from "@chakra-ui/react";
import { TimeLimitCutoffFooter } from "@/components/competitions/TimeLimitCutoffFooter";
import { getEvents } from "@/lib/wca/competitions/wcif/getEvents";
import {
  advancementResultCondition,
  cutoffToString,
  getRoundTypeId,
  qualificationToString,
  resultConditionToString,
  timeLimitToString,
} from "@/lib/wca/wcif/rounds";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";

interface TabEventsProps {
  competitionId: string;
}

export default async function TabEvents({ competitionId }: TabEventsProps) {
  const { t } = await getT();
  const { data: events, error, response } = await getEvents(competitionId);

  if (error) return <OpenapiError response={response} t={t} />;

  if (!events) {
    return <Text>{t("competitions.registration_v2.errors.-1000")}</Text>;
  }

  const allRounds = events.flatMap((event) => event.rounds);

  const showCutoff = events.some((event) =>
    event.rounds.some((round) => Boolean(round.cutoff)),
  );

  const showQualifications = events.some((event) =>
    Boolean(event.qualification),
  );

  return (
    <Card.Root>
      <Card.Body>
        <Table.ScrollArea borderWidth="1px" maxW="full">
          <Table.Root striped interactive>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>
                  {t("results.table_elements.event")}
                </Table.ColumnHeader>
                <Table.ColumnHeader>
                  {t("competitions.results_table.round")}
                </Table.ColumnHeader>
                <Table.ColumnHeader>
                  {t("competitions.events.format")}
                </Table.ColumnHeader>
                <Table.ColumnHeader>
                  {t("competitions.events.time_limit")}
                </Table.ColumnHeader>
                {showCutoff && (
                  <Table.ColumnHeader>
                    {t("competitions.events.cutoff")}
                  </Table.ColumnHeader>
                )}
                <Table.ColumnHeader>
                  {t("competitions.events.proceed")}
                </Table.ColumnHeader>
                {showQualifications && (
                  <Table.ColumnHeader>
                    {t("competitions.events.qualification")}
                  </Table.ColumnHeader>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {events.map((event) =>
                event.rounds.map((round, idx) => {
                  const resultCondition = advancementResultCondition(
                    round.id,
                    event.rounds,
                  );

                  return (
                    <Table.Row key={round.id}>
                      {idx === 0 && (
                        <Table.Cell rowSpan={event.rounds.length}>
                          {t(`events.${event.id}`)}
                        </Table.Cell>
                      )}
                      <Table.Cell>
                        {t(
                          `rounds.${getRoundTypeId(idx + 1, event.rounds.length, Boolean(round.cutoff))}.cell_name`,
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {round.cutoff &&
                          `${t(`formats.short.${round.cutoff.numberOfAttempts}`)} / `}
                        {t(`formats.short.${round.format}`)}
                      </Table.Cell>
                      <Table.Cell>
                        {timeLimitToString(
                          t,
                          round.timeLimit,
                          event.id,
                          allRounds,
                        )}
                      </Table.Cell>
                      {showCutoff && (
                        <Table.Cell>
                          {round.cutoff &&
                            cutoffToString(t, round.cutoff, event.id)}
                        </Table.Cell>
                      )}
                      <Table.Cell>
                        {resultCondition &&
                          resultConditionToString(
                            t,
                            resultCondition,
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
                                    t,
                                    event.qualification,
                                    event.id,
                                  )
                                : "-"}
                            </>
                          )}
                        </Table.Cell>
                      )}
                    </Table.Row>
                  );
                }),
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Card.Body>
      <Card.Footer>
        <TimeLimitCutoffFooter events={events} />
      </Card.Footer>
    </Card.Root>
  );
}
