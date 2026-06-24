import { Container, Heading, HStack, Separator, Text } from "@chakra-ui/react";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { Fragment } from "react";
import { getLivePodiums } from "@/lib/wca/live/getLivePodiums";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import EventIcon from "@/components/EventIcon";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import _ from "lodash";
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
    error: podiumError,
    data: rounds,
    response,
  } = await getLivePodiums(competitionId);

  if (podiumError) {
    return <OpenapiError response={response} t={t} />;
  }

  const roundsByEventId = _.keyBy(
    rounds,
    (r) => parseActivityCode(r.id).eventId,
  );

  const roundsOfEventsHeld = WCA_EVENT_IDS.map(
    (e) => roundsByEventId[e],
  ).filter(Boolean);

  const [eventsFinished, eventsNotFinished] = _.partition(
    roundsOfEventsHeld,
    (e) => e.results.length > 0,
  );

  const noPodiums = eventsFinished.length === 0;

  return (
    <Container bg="bg">
      <Heading textStyle="h1">{t("competitions.live.podiums.title")}</Heading>
      {noPodiums && <Text>{t("competitions.live.podiums.none")}</Text>}
      {!noPodiums && eventsNotFinished.length > 0 && (
        <>
          <HStack gap="3" wrap="wrap">
            <Heading textStyle="h3">
              {t("competitions.live.podiums.undetermined")}:
            </Heading>
            <HStack gap="2" wrap="wrap">
              {eventsNotFinished.map((finalRound) => {
                const { eventId } = parseActivityCode(finalRound.id);
                return <EventIcon key={finalRound.id} eventId={eventId} />;
              })}
            </HStack>
          </HStack>
          <Separator my="4" />
        </>
      )}
      {eventsFinished.map((finalRound) => {
        const { eventId } = parseActivityCode(finalRound.id);

        const resultsByRegistrationId = _.groupBy(
          finalRound.results,
          "registration_id",
        );

        const competitors = new Map(
          finalRound.competitors.map((r) => [r.id, r]),
        );

        const isDualRound =
          finalRound.linked_round_ids && finalRound.linked_round_ids.length > 0;

        return (
          <Fragment key={finalRound.id}>
            <Heading textStyle="h3" p="2">
              <HStack gap="2">
                <EventIcon eventId={eventId} />
                {events.byId[eventId].name}
              </HStack>
            </Heading>
            <LiveResultsTable
              showLinkedRoundsView={isDualRound}
              resultsByRegistrationId={resultsByRegistrationId}
              competitionId={competitionId}
              competitors={competitors}
              roundWcifId={finalRound.id}
              formatId={finalRound.format}
              showEmpty={false}
            />
          </Fragment>
        );
      })}
    </Container>
  );
}
