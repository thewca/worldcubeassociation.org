import React from "react";
import { Heading, Link, Table, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import _ from "lodash";
import { components } from "@/types/openapi";
import { getT } from "@/lib/i18n/get18n";
import events from "@/lib/wca/data/events";
import EventIcon from "@/components/EventIcon";
import { AttemptsCells, WithRecordTag } from "@/components/results/TableCells";
import { resultAttempts } from "@/lib/wca/results/attempts";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";

type ChampionshipPodiums =
  components["schemas"]["V1PersonInfo"]["championship_podium_results"];
type ChampionshipLevel = keyof ChampionshipPodiums;

const ChampionshipPodiumsTab = async ({
  championshipPodiums,
}: {
  championshipPodiums: ChampionshipPodiums;
}) => {
  const { t } = await getT();

  return (
    <VStack align="stretch" gap={8}>
      {Object.entries(championshipPodiums).map(([level, results]) =>
        results.length === 0 ? null : (
          <PodiumTable
            key={level}
            title={t(
              `persons.show.championship_podium_levels.${level as ChampionshipLevel}`,
            )}
            results={results}
            t={t}
          />
        ),
      )}
    </VStack>
  );
};

function PodiumTable({
  title,
  results,
  t,
}: {
  title: string;
  results: components["schemas"]["V1Result"][];
  t: Awaited<ReturnType<typeof getT>>["t"];
}) {
  const resultsByCompetition = _.groupBy(results, "competition_id");

  return (
    <VStack align="stretch">
      <Heading size="md" textAlign="center">
        {title}
      </Heading>
      <Table.ScrollArea rounded="md">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>
                {t("competitions.results_table.event")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>{t("persons.show.place")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.single")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.average")}</Table.ColumnHeader>
              <Table.ColumnHeader colSpan={5} textAlign="left">
                {t("common.solves")}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Object.values(resultsByCompetition).map((competitionResults) => (
              <React.Fragment key={competitionResults[0].competition_id}>
                <Table.Row>
                  <Table.Cell colSpan={9}>
                    <Link asChild>
                      <NextLink
                        href={route({
                          pathname: "/competitions/[competitionId]",
                          query: {
                            competitionId: competitionResults[0].competition_id,
                          },
                        })}
                      >
                        {competitionResults[0].competition_short_name}
                      </NextLink>
                    </Link>
                  </Table.Cell>
                </Table.Row>
                {competitionResults.map((result) => {
                  const { definedAttempts, bestResultIndex, worstResultIndex } =
                    resultAttempts(result);

                  return (
                    <Table.Row key={result.id}>
                      <Table.Cell>
                        <EventIcon eventId={result.event_id} />{" "}
                        {events.byId[result.event_id].name}
                      </Table.Cell>
                      <Table.Cell>{result.pos}</Table.Cell>
                      <Table.Cell>
                        <WithRecordTag
                          recordTag={result.regional_single_record}
                        >
                          {formatAttemptResult(result.best, result.event_id)}
                        </WithRecordTag>
                      </Table.Cell>
                      <Table.Cell>
                        <WithRecordTag
                          recordTag={result.regional_average_record}
                        >
                          {formatAttemptResult(result.average, result.event_id)}
                        </WithRecordTag>
                      </Table.Cell>
                      <AttemptsCells
                        attempts={definedAttempts}
                        bestResultIndex={bestResultIndex}
                        worstResultIndex={worstResultIndex}
                        eventId={result.event_id}
                        recordTag={result.regional_single_record}
                        attemptCount={5}
                      />
                    </Table.Row>
                  );
                })}
              </React.Fragment>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </VStack>
  );
}

export default ChampionshipPodiumsTab;
