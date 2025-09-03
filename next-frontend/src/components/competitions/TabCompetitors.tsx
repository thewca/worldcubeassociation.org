"use client";
import React, { useMemo } from "react";
import { Card, Text, Table, Center, Spinner } from "@chakra-ui/react";
import EventIcon from "@/components/EventIcon";
import CountryMap from "@/components/CountryMap";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";

interface CompetitorData {
  id: string;
}

const TabCompetitors: React.FC<CompetitorData> = ({ id }) => {
  const api = useAPI();
  const { t } = useT();

  const { data: registrationsQuery, isFetching } = useQuery({
    queryKey: ["registrations", id],
    queryFn: () =>
      api.GET("/competitions/{competitionId}/registrations", {
        params: { path: { competitionId: id } },
      }),
  });

  const eventIds = useMemo(() => {
    const flatEventList = registrationsQuery?.data?.flatMap(
      (reg) => reg.event_ids,
    );

    const eventSet = new Set(flatEventList);
    return Array.from(eventSet);
  }, [registrationsQuery?.data]);

  if (isFetching) {
    return (
      <Center py={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!registrationsQuery?.data) {
    return <Text>{t("competitions.registration_v2.errors.-1001")}</Text>;
  }

  return (
    <Card.Root>
      <Card.Body>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Cell>Competitor</Table.Cell>
              <Table.Cell>Country</Table.Cell>
              {eventIds.map((eventId) => (
                <Table.Cell key={eventId}>
                  <EventIcon eventId={eventId} />
                </Table.Cell>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {registrationsQuery.data.map((registration) => (
              <Table.Row key={registration.id}>
                <Table.Cell>
                  <Text fontWeight="medium">{registration.user_id}</Text>
                </Table.Cell>
                <Table.Cell>
                  <CountryMap code="AU" bold t={t} />
                </Table.Cell>

                {eventIds.map((eventId) => (
                  <Table.Cell key={eventId}>
                    {registration.event_ids.includes(eventId) ? (
                      <EventIcon eventId={eventId} />
                    ) : null}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card.Body>
    </Card.Root>
  );
};

export default TabCompetitors;
