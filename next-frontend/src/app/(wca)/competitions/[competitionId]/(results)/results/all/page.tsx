import { Card, Text } from "@chakra-ui/react";
import _ from "lodash";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getCompetitionResults } from "@/lib/wca/competitions/getCompetitionResults";
import FilteredResults from "@/app/(wca)/competitions/[competitionId]/(results)/results/all/FilteredResults";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function PodiumsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { t } = await getT();

  const {
    data: competitionInfo,
    error,
    response: competitionResponse,
  } = await getCompetitionInfo(competitionId);

  if (error) return <OpenapiError t={t} response={competitionResponse} />;

  const {
    error: resultsError,
    data: competitionResults,
    response: resultsResponse,
  } = await getCompetitionResults(competitionId);

  if (resultsError) return <OpenapiError t={t} response={resultsResponse} />;

  const resultsByEvent = _.groupBy(competitionResults, "event_id");

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">Results</Card.Title>
        <FilteredResults
          competitionInfo={competitionInfo}
          resultsByEvent={resultsByEvent}
        />
      </Card.Body>
    </Card.Root>
  );
}
