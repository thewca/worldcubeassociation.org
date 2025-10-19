import WcaFlag from "@/components/WcaFlag";
import EventIcon from "@/components/EventIcon";
import events from "@/lib/wca/data/events";
import { HStack, Icon, Link, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
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

interface AttemptsCellProps {
  attempts: number[];
  bestResultIndex: number;
  worstResultIndex: number;
  eventId: string;
}

export function AttemptsCells({
  attempts,
  bestResultIndex,
  worstResultIndex,
  eventId,
}: AttemptsCellProps) {
  return attempts.map((a, i) => (
    // One Cell per Solve of an Average. The exact same result may occur multiple times
    //   in the same average (think FMC), so we use the iteration index as key.

    <Table.Cell key={`attempt-${a}-${i}`}>
      {attempts.filter(Boolean).length === 5 &&
      (i === bestResultIndex || i === worstResultIndex)
        ? `(${formatAttemptResult(a, eventId)})`
        : formatAttemptResult(a, eventId)}
    </Table.Cell>
  ));
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
