"use client";

import {
  Button,
  Card,
  Container,
  HStack,
  Link,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import { route } from "nextjs-routes";

import EventIcon from "@/components/EventIcon";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import RoundActions from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/admin/RoundActions";
import { useAllRoundsInfo } from "@/providers/RoundInfoProvider";

export default function RoundAdmin({
  competitionId,
}: {
  competitionId: string;
}) {
  const { rounds } = useAllRoundsInfo();

  const roundsById = _.groupBy(rounds, (d) => parseActivityCode(d.id).eventId);

  return (
    <Container>
      <Button asChild mb={4} variant="outline" size="sm">
        <Link
          href={route({
            pathname: "/competitions/[competitionId]/live/scoretakers",
            query: { competitionId },
          })}
        >
          Manage scoretakers
        </Link>
      </Button>
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
