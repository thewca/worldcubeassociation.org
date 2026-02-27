import { Container, Heading } from "@chakra-ui/react";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { Fragment } from "react";
import { getLivePodiums } from "@/lib/wca/live/getLivePodiums";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
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

  return (
    <Container>
      <Heading textStyle="h1">{t("competitions.live.podiums.title")}</Heading>
      {WCA_EVENT_IDS.map((e) => {
        const finalRound = roundsByEventId[e];
        if (!finalRound) return;

        const resultsByRegistrationId = _.groupBy(
          finalRound.results,
          "registration_id",
        );

        return (
          <Fragment key={finalRound.id}>
            <Heading textStyle="h3" p="2">
              {events.byId[e].name}
            </Heading>
            {finalRound.results.length > 0 ? (
              <LiveResultsTable
                resultsByRegistrationId={resultsByRegistrationId}
                competitionId={competitionId}
                competitors={finalRound.competitors}
                roundWcifId={finalRound.id}
                formatId={finalRound.format}
                showEmpty={false}
              />
            ) : (
              t("competitions.live.podiums.undetermined")
            )}
          </Fragment>
        );
      })}
    </Container>
  );
}
