import WcaFlag from "@/components/WcaFlag";
import EventIcon from "@/components/EventIcon";
import events from "@/lib/wca/data/events";
import { HStack, Icon, Link, Table } from "@chakra-ui/react";
import countries from "@/lib/wca/data/countries";

interface CountryCellProps {
  countryId: string;
}

export function CountryCell({ countryId }: CountryCellProps) {
  const country = countries.byId[countryId];
  return (
    <Table.Cell>
      {country && (
        <Icon asChild size="sm">
          <WcaFlag code={country.iso2} />
        </Icon>
      )}{" "}
      {country.name}
    </Table.Cell>
  );
}
interface CompetitionCellProps {
  competitionId: string;
  competitionName: string;
  competitionCountry: string;
}

export function CompetitionCell({
  competitionId,
  competitionName,
  competitionCountry,
}: CompetitionCellProps) {
  const country = countries.byId[competitionCountry];

  return (
    <Table.Cell>
      <HStack>
        <Icon asChild size="sm">
          <WcaFlag code={country.iso2} />
        </Icon>
        <Link href={`/competitions/${competitionId}`}>{competitionName}</Link>
      </HStack>
    </Table.Cell>
  );
}

interface PersonCellProps {
  personId: string;
  personName: string;
}

export function PersonCell({ personId, personName }: PersonCellProps) {
  return (
    <Table.Cell>
      <Link href={`/persons/${personId}`}>{personName}</Link>
    </Table.Cell>
  );
}

interface EventCellProps {
  eventId: string;
}

export function EventCell({ eventId }: EventCellProps) {
  return (
    <Table.Cell>
      <EventIcon eventId={eventId} /> {events.byId[eventId].name}
    </Table.Cell>
  );
}
