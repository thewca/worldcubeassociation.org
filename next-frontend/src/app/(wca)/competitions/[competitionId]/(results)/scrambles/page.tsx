import { Card, Text } from "@chakra-ui/react";
import _ from "lodash";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getScrambles } from "@/lib/wca/competitions/getScrambles";
import FilteredScrambles from "./FilteredScrambles";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function ScramblesPage({
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
    error: scrambleError,
    data: scrambles,
    response: scrambleResponse,
  } = await getScrambles(competitionId);

  if (scrambleError) return <OpenapiError t={t} response={scrambleResponse} />;

  const scramblesByEvent = _.groupBy(scrambles, "event_id");

  return (
    <Card.Root>
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
