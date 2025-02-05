import React from 'react';
import { Table } from 'semantic-ui-react';
import CountryFlag from '../wca/CountryFlag';
import EventIcon from '../wca/EventIcon';
import { competitionUrl, personUrl } from '../../lib/requests/routes.js.erb';
import { formatAttemptResult } from '../../lib/wca-live/attempts';
import { events } from '../../lib/wca-data.js.erb';

export function CountryCell({ country }) {
  return (
    <Table.Cell textAlign="left">
      {country.iso2 && <CountryFlag iso2={country.iso2} />}
      {' '}
      {country.name}
    </Table.Cell>
  );
}

export function AttemptsCells({
  attempts, bestResultIndex, worstResultIndex, eventId,
}) {
  return attempts.map((a, i) => (
    // One Cell per Solve of an Average
    <Table.Cell>
      {attempts.filter(Boolean).length === 5
      && (i === bestResultIndex || i === worstResultIndex) ? (
          `(${formatAttemptResult(a, eventId)})`
        ) : (
          formatAttemptResult(a, eventId)
        )}
    </Table.Cell>
  ));
}

export function CompetitionCell({ competition, compatIso2 }) {
  // TODO: The `compatIso2` hack can be deleted as soon as this has been deployed
  //   and CAD has been run at least once. (The React-ified `Rankings` and `Records`
  //   tables did not serialize their country data the same way, so some old,
  //   non-unified data may still be stuck in the cache during deployment)
  const iso2 = compatIso2 || competition.country.iso2;

  return (
    <Table.Cell>
      <CountryFlag iso2={iso2} />
      {' '}
      <a href={competitionUrl(competition.id)}>{competition.cellName}</a>
    </Table.Cell>
  );
}

export function PersonCell({ personId, personName }) {
  return (
    <Table.Cell>
      <a href={personUrl(personId)}>{personName}</a>
    </Table.Cell>
  );
}

export function EventCell({ eventId }) {
  return (
    <Table.Cell>
      <EventIcon id={eventId} />
      {' '}
      {events.byId[eventId].name}
    </Table.Cell>
  );
}
