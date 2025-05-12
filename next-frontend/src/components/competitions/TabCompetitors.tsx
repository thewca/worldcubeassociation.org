"use client";
import React from "react";
import { Card, Text, Table, Center, Spinner } from "@chakra-ui/react";
import EventIcon from "@/components/EventIcon";
import CountryMap from "@/components/CountryMap";
import { useEffect, useState } from "react";

const ALL_EVENTS = [
  "333",
  "222",
  "444",
  "555",
  "666",
  "777",
  "333bf",
  "333fm",
  "333oh",
  "clock",
  "minx",
  "pyram",
  "skewb",
  "sq1",
  "444bf",
  "555bf",
  "333mbf",
];

interface CompetitorData {
  id: string;
}
const TabCompetitors: React.FC<CompetitorData> = ({ id }) => {
  const [competitors, setCompetitors] = useState<Person[]>([]);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `https://www.worldcubeassociation.org/api/v0/competitions/${id}/wcif/public`,
    )
      .then((res) => res.json())
      .then((data) => {
        const people: Person[] = data.persons.filter(
          (p: Person) => p.registration?.isCompeting,
        );
        setCompetitors(people);

        const allEventIds = new Set<string>();
        people.forEach((p) => {
          p.registration?.eventIds.forEach((id) => allEventIds.add(id));
        });
        setEventIds(
          Array.from(allEventIds).sort(
            (a, b) => ALL_EVENTS.indexOf(a) - ALL_EVENTS.indexOf(b),
          ),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" />
      </Center>
    );
  }
  return (
    <Card.Root>
      <Card.Body>
        <Table.Root width="100%">
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
            {competitors.map((person) => (
              <Table.Row key={person.wcaId || person.name}>
                <Table.Cell>
                  <Text fontWeight="medium">{person.name}</Text>
                </Table.Cell>
                <Table.Cell>
                  <CountryMap code={person.countryIso2} bold />
                </Table.Cell>

                {eventIds.map((eventId) => (
                  <Table.Cell key={eventId}>
                    {person.registration?.eventIds.includes(eventId) ? (
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
