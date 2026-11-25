"use client";

import type { components } from "@/types/openapi";
import { TFunction } from "i18next";
import { Heading, RadioGroup, Stack, VStack } from "@chakra-ui/react";
import _ from "lodash";
import { ByCompetitionTable } from "@/components/results/ResultsTable";
import events from "@/lib/wca/data/events";
import continents from "@/lib/wca/data/continents";
import { Fragment, useState } from "react";

export default function RecordsTable({
  recordResults,
  t,
}: {
  recordResults: components["schemas"]["V1Results"];
  t: TFunction;
}) {
  // A result can hold two records (e.g. single WR + average NR),
  // so it must be able to appear under more than one record type.
  const recordsByType = _.mapValues(
    _.groupBy(
      recordResults.flatMap((result) =>
        _.uniq(
          _.compact([
            result.regional_single_record,
            result.regional_average_record,
          ]),
        ).map((tag) => ({ tag, result })),
      ),
      "tag",
    ),
    (entries) => entries.map(({ result }) => result),
  );

  const heldRecordTypes = [
    {
      id: "world",
      label: t("persons.show.world_records"),
      results: recordsByType["WR"] ?? [],
    },
    {
      id: "continental",
      label: t("persons.show.continental_records"),
      results: continents.real.flatMap(
        ({ recordName }) => recordsByType[recordName] ?? [],
      ),
    },
    {
      id: "national",
      label: t("persons.show.national_records"),
      results: recordsByType["NR"] ?? [],
    },
  ].filter(({ results }) => results.length > 0);

  const [shownTypeId, setShownTypeId] = useState(heldRecordTypes[0]?.id);

  const shownRecordType = heldRecordTypes.find(({ id }) => id === shownTypeId);

  if (!shownRecordType) return null;

  return (
    <VStack align="start">
      {heldRecordTypes.length > 1 ? (
        <RadioGroup.Root
          value={shownTypeId}
          onValueChange={({ value }) => value && setShownTypeId(value)}
        >
          <Stack direction={{ base: "column", md: "row" }} gap="4">
            {heldRecordTypes.map(({ id, label }) => (
              <RadioGroup.Item key={id} value={id}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{label}</RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </Stack>
        </RadioGroup.Root>
      ) : (
        <Heading textStyle="h2">{shownRecordType.label}</Heading>
      )}
      <RecordsByEvent recordResults={shownRecordType.results} t={t} />
    </VStack>
  );
}

function RecordsByEvent({
  recordResults,
  t,
}: {
  recordResults: components["schemas"]["V1Results"];
  t: TFunction;
}) {
  const resultsByEvent = _.groupBy(recordResults, "event_id");
  return _.map(resultsByEvent, (results, eventId) => {
    return (
      <Fragment key={eventId}>
        <Heading textStyle="h3">{events.byId[eventId].name}</Heading>
        <ByCompetitionTable results={results} t={t} />
      </Fragment>
    );
  });
}
