import { Card } from "@chakra-ui/react";
import _ from "lodash";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getCompetitionResults } from "@/lib/wca/competitions/getCompetitionResults";
import { getHeadToHead } from "@/lib/wca/competitions/getHeadToHead";
import FilteredResults from "@/app/(wca)/(content-pages)/competitions/[competitionId]/(competition)/(results)/results/all/FilteredResults";
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

  const {
    error: h2hError,
    data: h2hRounds,
    response: h2hResponse,
  } = await getHeadToHead(competitionId);

  if (h2hError) return <OpenapiError t={t} response={h2hResponse} />;

  const roundsByEvent = _.groupBy(competitionResults, "event_id");
  const h2hRoundsById = _.keyBy(h2hRounds, "wcif_id");

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">Results</Card.Title>
        <FilteredResults
          competitionInfo={competitionInfo}
          roundsByEvent={roundsByEvent}
          h2hRoundsById={h2hRoundsById}
        />
      </Card.Body>
    </Card.Root>
  );
}
