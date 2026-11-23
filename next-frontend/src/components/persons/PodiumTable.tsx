import { Heading, Link, Table, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import _ from "lodash";
import { components } from "@/types/openapi";
import { getT } from "@/lib/i18n/get18n";
import EventIcon from "@/components/EventIcon";
import { AttemptsCells, WithRecordTag } from "@/components/results/TableCells";
import { maxAttemptCount, resultAttempts } from "@/lib/wca/results/attempts";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";

type Result = components["schemas"]["V1Result"];

const LEADING_COLUMN_COUNT = 4;

export default async function PodiumTable({
  title,
  results,
}: {
  title: string;
  results: Result[];
}) {
  const { t } = await getT();

  const resultsByCompetition = Object.values(
    _.groupBy(results, "competition_id"),
  );
  const attemptCount = maxAttemptCount(results);

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
              <Table.ColumnHeader colSpan={attemptCount} textAlign="start">
                {t("common.solves")}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {resultsByCompetition.map((competitionResults) => (
              <CompetitionPodiumRows
                key={competitionResults[0].competition_id}
                results={competitionResults}
                attemptCount={attemptCount}
              />
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </VStack>
  );
}

function CompetitionPodiumRows({
  results,
  attemptCount,
}: {
  results: Result[];
  attemptCount: number;
}) {
  const { competition_id: competitionId, competition_short_name: name } =
    results[0];

  return (
    <>
      <Table.Row>
        <Table.Cell colSpan={LEADING_COLUMN_COUNT + attemptCount}>
          <Link asChild>
            <NextLink
              href={route({
                pathname: "/competitions/[competitionId]",
                query: { competitionId },
              })}
            >
              {name}
            </NextLink>
          </Link>
        </Table.Cell>
      </Table.Row>
      {results.map((result) => (
        <PodiumResultRow
          key={result.id}
          result={result}
          attemptCount={attemptCount}
        />
      ))}
    </>
  );
}

async function PodiumResultRow({
  result,
  attemptCount,
}: {
  result: Result;
  attemptCount: number;
}) {
  const { t } = await getT();
  const { definedAttempts, bestResultIndex, worstResultIndex } =
    resultAttempts(result);

  return (
    <Table.Row>
      <Table.Cell>
        <EventIcon eventId={result.event_id} /> {t(`events.${result.event_id}`)}
      </Table.Cell>
      <Table.Cell>{result.pos}</Table.Cell>
      <Table.Cell>
        <WithRecordTag recordTag={result.regional_single_record}>
          {formatAttemptResult(result.best, result.event_id)}
        </WithRecordTag>
      </Table.Cell>
      <Table.Cell>
        <WithRecordTag recordTag={result.regional_average_record}>
          {formatAttemptResult(result.average, result.event_id)}
        </WithRecordTag>
      </Table.Cell>
      <AttemptsCells
        attempts={definedAttempts}
        bestResultIndex={bestResultIndex}
        worstResultIndex={worstResultIndex}
        eventId={result.event_id}
        recordTag={result.regional_single_record}
        attemptCount={attemptCount}
      />
    </Table.Row>
  );
}
