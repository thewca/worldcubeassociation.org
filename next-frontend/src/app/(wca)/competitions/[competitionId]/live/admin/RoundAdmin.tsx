import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import { Card, Container, HStack, SimpleGrid, VStack } from "@chakra-ui/react";

import EventIcon from "@/components/EventIcon";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import RoundActions from "@/app/(wca)/competitions/[competitionId]/live/admin/RoundActions";
import { getRounds } from "@/lib/wca/live/getRounds";

export default async function RoundAdmin({
  competitionId,
}: {
  competitionId: string;
}) {
  const { t } = await getT();
  const { error, data, response } = await getRounds(competitionId);

  if (error) {
    return <OpenapiError t={t} response={response} />;
  }

  const roundsById = _.groupBy(
    data.rounds,
    (d) => parseActivityCode(d.id).eventId,
  );

  return (
    <Container>
      <SimpleGrid columns={3} gap={2}>
        {_.map(roundsById, (rounds, eventId) => {
          return (
            <Card.Root key={eventId} rounded="md" size="sm">
              <Card.Body alignItems="baseline">
                <Card.Title>
                  <HStack>
                    <EventIcon eventId={eventId} fontSize="2xl" />
                    {events.byId[eventId].name}
                  </HStack>
                </Card.Title>
                <Card.Description w="full" asChild>
                  <VStack gap="0" alignItems="left">
                    {rounds.map((r) => {
                      return (
                        <RoundActions
                          key={r.id}
                          round={r}
                          rounds={rounds}
                          competitionId={competitionId}
                        />
                      );
                    })}
                  </VStack>
                </Card.Description>
              </Card.Body>
            </Card.Root>
          );
        })}
      </SimpleGrid>
    </Container>
  );
}
