import React from 'react';
import { Table } from 'semantic-ui-react';
import EventIcon from '../wca/EventIcon';
import { competitionUrl, personUrl } from '../../lib/requests/routes.js.erb';
import { formatAttemptResult } from '../../lib/wca-live/attempts';
import { events } from '../../lib/wca-data.js.erb';
import RegionFlag from '../wca/RegionFlag';

export function CountryCell({ country }) {
  return (
    <>
      {country.iso2 && <RegionFlag iso2={country.iso2} withoutTooltip />}
      {' '}
      {country.name}
    </>
  );
}

export function AttemptsCells({
  attempts, bestResultIndex, worstResultIndex, eventId,
}) {
  return attempts.map((a, i) => (
    // One Cell per Solve of an Average. The exact same result may occur multiple times
    //   in the same average (think FMC), so we use the iteration index as key.
    // eslint-disable-next-line react/no-array-index-key
    <Table.Cell key={`attempt-${a}-${i}`}>
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
    <>
      <RegionFlag iso2={iso2} />
      {' '}
      <a href={competitionUrl(competition.id)}>{competition.cellName}</a>
    </>
  );
}

export function PersonCell({ personId, personName }) {
  return (
    <a href={personUrl(personId)}>{personName}</a>
  );
}

export function EventCell({ eventId }) {
  return (
    <>
      <EventIcon id={eventId} />
      {' '}
      {events.byId[eventId].name}
    </>
  );
}
