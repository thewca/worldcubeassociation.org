"use client";

import type { components } from "@/types/openapi";
import { TFunction } from "i18next";
import { Checkbox, CheckboxGroup, Heading, VStack } from "@chakra-ui/react";
import _ from "lodash";
import { ByCompetitionTable } from "@/components/results/ResultsTable";
import events from "@/lib/wca/data/events";
import continents from "@/lib/wca/data/continents";
import { Fragment, useState } from "react";

const RECORD_TYPES = ["world", "continental", "national"] as const;

export default function RecordsTable({
  recordResults,
  t,
}: {
  recordResults: components["schemas"]["V1Results"];
  t: TFunction;
}) {
  const recordsByType = _.groupBy(
    recordResults,
    (r) => r.regional_single_record || r.regional_average_record,
  );

  const heldRecordTypes = RECORD_TYPES.filter((recordType) => {
    if (recordType === "world") return "WR" in recordsByType;
    if (recordType === "national") return "NR" in recordsByType;
    return continents.real.some(
      ({ recordName }) => recordName in recordsByType,
    );
  });

  const [shownRecordTypes, setShownRecordTypes] =
    useState<string[]>(heldRecordTypes);

  return (
    <VStack align="left">
      {heldRecordTypes.length > 1 && (
        <CheckboxGroup
          value={shownRecordTypes}
          onValueChange={setShownRecordTypes}
          flexDirection="row"
          flexWrap="wrap"
          gap="4"
        >
          {heldRecordTypes.map((recordType) => (
            <Checkbox.Root key={recordType} value={recordType}>
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>
                {t(
                  // i18n-tasks-use t("persons.show.record_types.world")
                  // i18n-tasks-use t("persons.show.record_types.continental")
                  // i18n-tasks-use t("persons.show.record_types.national")
                  `persons.show.record_types.${recordType}`,
                )}
              </Checkbox.Label>
            </Checkbox.Root>
          ))}
        </CheckboxGroup>
      )}
      {shownRecordTypes.includes("world") && "WR" in recordsByType && (
        <>
          <Heading textStyle="h2">{t("persons.show.world_records")}</Heading>
          <RecordsByEvent recordResults={recordsByType["WR"]} t={t} />
        </>
      )}
      {shownRecordTypes.includes("continental") &&
        continents.real.map(({ recordName: region }) => {
          return (
            region in recordsByType && (
              <Fragment key={region}>
                <Heading textStyle="h2">
                  {t("persons.show.continental_records")}
                </Heading>
                <RecordsByEvent recordResults={recordsByType[region]} t={t} />
              </Fragment>
            )
          );
        })}
      {shownRecordTypes.includes("national") && "NR" in recordsByType && (
        <>
          <Heading textStyle="h2">{t("persons.show.national_records")}</Heading>
          <RecordsByEvent recordResults={recordsByType["NR"]} t={t} />
        </>
      )}
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
