import WcaFlag from "@/components/WcaFlag";
import EventIcon from "@/components/EventIcon";
import events from "@/lib/wca/data/events";
import { HStack, Link, Table } from "@chakra-ui/react";
import countries from "@/lib/wca/data/countries";
import RegionFilterLink from "@/components/results/RegionFilterLink";

type CountryCellProps = (
  | {
      countryId: string;
      countryIso2?: undefined;
    }
  | {
      countryIso2: string;
      countryId?: undefined;
    }
) & {
  rowSpan?: number;
  hideBelow?: string;
  // Renders the region as a link that adds a region filter to the current query
  filterable?: boolean;
};

export function CountryCell({
  countryId,
  countryIso2,
  rowSpan,
  hideBelow,
  filterable = false,
}: CountryCellProps) {
  const country =
    // Explicitly check for undefined so TypeScript knows which branch it is
    countryId !== undefined
      ? countries.byId[countryId]
      : countries.byIso2[countryIso2];
  return (
    <Table.Cell rowSpan={rowSpan} hideBelow={hideBelow}>
      {country && <WcaFlag code={country.iso2} size="sm" />}{" "}
      {filterable ? (
        <RegionFilterLink iso2={country.iso2}>{country.name}</RegionFilterLink>
      ) : (
        country.name
      )}
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
        <WcaFlag code={country.iso2} size="sm" />
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
    // The ScrollArea sets `white-space: nowrap` on everything; names are the one
    //   column we let wrap, so the result column stays on screen on narrow phones.
    <Table.Cell whiteSpace="normal">
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
