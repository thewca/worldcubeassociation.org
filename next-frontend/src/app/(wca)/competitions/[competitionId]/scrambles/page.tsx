import { Card, Container, HStack, Text } from "@chakra-ui/react";
import _ from "lodash";
import { getT } from "@/lib/i18n/get18n";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { InfoCard } from "@/components/competitions/Cards";
import { MarkdownFirstImage } from "@/components/MarkdownFirstImage";
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

  const { t } = await getT();

  const { error: scrambleError, data: scrambles } =
    await getScrambles(competitionId);

  if (scrambleError) {
    return <Text>Error fetching scrambles</Text>;
  }

  const resultsByEvent = _.groupBy(scrambles, "event_id");

  return (
    <Container bg="bg">
      <HStack gap="8" alignItems="stretch">
        <InfoCard competitionInfo={competitionInfo} t={t} />
        <MarkdownFirstImage content={competitionInfo.information} />
      </HStack>
      <Card.Root variant="plain" mt="8">
        <Card.Body>
          <Card.Title>
            <Text
              fontSize="md"
              textTransform="uppercase"
              fontWeight="medium"
              letterSpacing="wider"
            >
              Results
            </Text>
          </Card.Title>
          <FilteredScrambles
            competitionInfo={competitionInfo}
            resultsByEvent={resultsByEvent}
          />
        </Card.Body>
      </Card.Root>
    </Container>
  );
}
