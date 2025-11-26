import type { components } from "@/types/openapi";
import { TFunction } from "i18next";
import { Heading, VStack } from "@chakra-ui/react";
import _ from "lodash";
import { ByCompetitionTable } from "@/components/results/ResultsTable";
import events from "@/lib/wca/data/events";

export default function RecordsTable({
  recordResults,
  t,
}: {
  recordResults: components["schemas"]["Results"];
  t: TFunction;
}) {
  const recordsByType = _.groupBy(
    recordResults,
    (r) => r.regional_single_record || r.regional_average_record,
  );

  return (
    <VStack align="left">
      {"WR" in recordsByType && (
        <>
          <Heading textStyle="h2">{t("persons.show.world_records")}</Heading>
          <RecordsByEvent recordResults={recordsByType["WR"]} t={t} />
        </>
      )}
      {["ER", "NAR", "SAR", "ASR", "OCR"].map((region) => {
        return (
          region in recordsByType && (
            <>
              <Heading textStyle="h2">
                {t("persons.show.continental_records")}
              </Heading>
              <RecordsByEvent recordResults={recordsByType[region]} t={t} />
            </>
          )
        );
      })}
      {"NR" in recordsByType && (
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
  recordResults: components["schemas"]["Results"];
  t: TFunction;
}) {
  const resultsByEvent = _.groupBy(recordResults, "event_id");
  return _.map(resultsByEvent, (results, eventId) => {
    return (
      <>
        <Heading textStyle="h3">{events.byId[eventId].name}</Heading>
        <ByCompetitionTable results={results} t={t} />
      </>
    );
  });
}
