import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import { auth } from "@/auth";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import {
  Button,
  Card,
  Container,
  HStack,
  Link,
  SimpleGrid,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import EventIcon from "@/components/EventIcon";
import { getRoundTypeId, parseActivityCode } from "@/lib/wca/wcif/rounds";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import ActionButtons from "@/app/(wca)/competitions/[competitionId]/live/admin/ActionButtons";

export default async function LiveOverview({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const session = await auth();

  if (!session) {
    return <p>Please Log in</p>;
  }

  const client = serverClientWithToken(session.accessToken);

  const { error, data, response } = await client.GET(
    "/v1/competitions/{competitionId}/live/admin",
    { params: { path: { competitionId } } },
  );

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
            <Card.Root key={eventId} rounded="md">
              <Card.Body alignItems="baseline">
                <Card.Title>
                  <HStack>
                    <EventIcon eventId={eventId} fontSize="2xl" />
                    {events.byId[eventId].name}
                  </HStack>
                </Card.Title>
                <Card.Description>
                  {rounds.map((r) => {
                    const { roundNumber } = parseActivityCode(r.id);
                    const roundTypeId = getRoundTypeId(
                      roundNumber!,
                      rounds.length,
                      false,
                    );
                    return (
                      <HStack key={r.id} textAlign="left">
                        <Button
                          asChild
                          variant="subtle"
                          flex="1"
                          disabled={["open", "locked"].includes(r.state)}
                        >
                          <Link asChild textStyle="headerLink">
                            <NextLink
                              href={route({
                                // TODO move to [roundId]/admin when the PR is merged
                                pathname:
                                  "/competitions/[competitionId]/live/rounds/[roundId]",
                                query: {
                                  competitionId,
                                  roundId: r.id,
                                },
                              })}
                            >
                              {t(`rounds.${roundTypeId}.name`)}{" "}
                              {r.state == "open" &&
                                `(${r.competitors_live_results_entered}/${r.total_competitors}) entered`}
                              {r.state == "locked" &&
                                `${r.total_competitors} locked`}
                            </NextLink>
                          </Link>
                        </Button>
                        <ActionButtons
                          state={r.state}
                          roundId={r.id}
                          competitionId={competitionId}
                        />
                      </HStack>
                    );
                  })}
                </Card.Description>
              </Card.Body>
            </Card.Root>
          );
        })}
      </SimpleGrid>
    </Container>
  );
}
