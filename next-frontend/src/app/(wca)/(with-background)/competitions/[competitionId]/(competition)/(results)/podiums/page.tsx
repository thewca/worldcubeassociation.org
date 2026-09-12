import { Card, Heading, Text, VStack } from "@chakra-ui/react";
import { ResultsTable } from "@/components/results/ResultsTable";
import events from "@/lib/wca/data/events";
import { getPodiums } from "@/lib/wca/competitions/getPodiums";
import { Fragment } from "react";
import { getT } from "@/lib/i18n/get18n";
import EventIcon from "@/components/EventIcon";

export default async function PodiumsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { t } = await getT();

  const { error: podiumError, data: podiumResults } =
    await getPodiums(competitionId);

  if (podiumError) {
    return <Text>Error fetching Podiums</Text>;
  }

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title asChild>
          <Text textStyle="s3">Podiums</Text>
        </Card.Title>
        <VStack align="left" gap={4}>
          {podiumResults.map((podium) => (
            <Fragment key={podium.event_id}>
              <Heading
                size="2xl"
                display="inline-flex"
                alignItems="center"
                gap="2"
              >
                <EventIcon eventId={podium.event_id} />
                {events.byId[podium.event_id].name}
              </Heading>
              {/* Already ordered by `global_pos`, which is the position a podium is decided on. */}
              <ResultsTable
                results={podium.results}
                t={t}
                eventId={podium.event_id}
                formatId={podium.format_id}
                rankingMode={podium.ranking_mode}
                variant="standings"
                isAdmin={false}
                solveTextAlign="center"
              />
            </Fragment>
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
