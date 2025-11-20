import { HStack, Icon, Link, Table, Text } from "@chakra-ui/react";
import EventIcon from "@/components/EventIcon";
import { route } from "nextjs-routes";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import { components } from "@/types/openapi";
import { TFunction } from "i18next";

export default function CompetitorTable({
  eventIds,
  registrations,
  t,
  setPsychSheetEvent,
}: {
  eventIds: string[];
  registrations: components["schemas"]["RegistrationDataV2"][];
  setPsychSheetEvent: (eventId: string) => void;
  t: TFunction;
}) {
  return (
    <Table.Root width="100%">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Name</Table.ColumnHeader>
          <Table.ColumnHeader>Representing</Table.ColumnHeader>
          {eventIds.map((eventId) => (
            <Table.ColumnHeader
              key={eventId}
              onClick={() => setPsychSheetEvent(eventId)}
              _hover={{ bg: "grey.solid", color: "wcawhite.contrast" }}
            >
              <EventIcon eventId={eventId} />
            </Table.ColumnHeader>
          ))}
          <Table.ColumnHeader>Total</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {registrations
          .toSorted((a, b) => a.user.name.localeCompare(b.user.name))
          .map((registration) => (
            <Table.Row key={registration.id}>
              <Table.Cell>
                {registration.user.wca_id ? (
                  <Link
                    href={route({
                      pathname: "/persons/[wcaId]",
                      query: { wcaId: registration.user.wca_id },
                    })}
                  >
                    <Text fontWeight="medium">{registration.user.name}</Text>
                  </Link>
                ) : (
                  <Text fontWeight="medium">{registration.user.name}</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <HStack>
                  <Icon asChild size="sm">
                    <WcaFlag code={registration.user.country_iso2} />
                  </Icon>
                  <CountryMap
                    code={registration.user.country_iso2}
                    t={t}
                    fontWeight="bold"
                  />
                </HStack>
              </Table.Cell>

              {eventIds.map((eventId) => (
                <Table.Cell key={eventId}>
                  {registration.competing.event_ids.includes(eventId) ? (
                    <EventIcon eventId={eventId} />
                  ) : null}
                </Table.Cell>
              ))}
              <Table.Cell>{registration.competing.event_ids.length}</Table.Cell>
            </Table.Row>
          ))}
      </Table.Body>
    </Table.Root>
  );
}
