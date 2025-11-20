import { Card, Text } from "@chakra-ui/react";
import _ from "lodash";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getScrambles } from "@/lib/wca/competitions/getScrambles";
import FilteredScrambles from "./FilteredScrambles";

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

  const { error: scrambleError, data: scrambles } =
    await getScrambles(competitionId);

  if (scrambleError) {
    return <Text>Error fetching scrambles</Text>;
  }

  const scramblesByEvent = _.groupBy(scrambles, "event_id");

  return (
    <Card.Root coloredBg>
      <Card.Body>
        <Card.Title textStyle="s4">Scrambles</Card.Title>
        <FilteredScrambles
          competitionInfo={competitionInfo}
          resultsByEvent={scramblesByEvent}
        />
      </Card.Body>
    </Card.Root>
  );
}
