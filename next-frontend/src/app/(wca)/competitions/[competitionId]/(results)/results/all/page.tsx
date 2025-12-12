import { Card, Text } from "@chakra-ui/react";
import _ from "lodash";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getCompetitionResults } from "@/lib/wca/competitions/getCompetitionResults";
import FilteredResults from "@/app/(wca)/competitions/[competitionId]/(results)/results/all/FilteredResults";

export default async function PodiumsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error) {
    return <Text>Error fetching competition</Text>;
  }

  const { error: resultsError, data: competitionResults } =
    await getCompetitionResults(competitionId);

  if (resultsError) {
    return <Text>Error fetching Results</Text>;
  }

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
