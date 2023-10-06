/* eslint-disable react/no-danger */
/* eslint-disable camelcase */
import React, { useMemo, useState } from 'react';
import {
  Table, Message, Button, Popup,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import Loading from '../../Requests/Loading';
import TableWrapper from './TableWrapper';
import { registrationCollisionsJsonUrl } from '../../../lib/requests/routes.js.erb';
import { events } from '../../../lib/wca-data.js.erb';
import { useStore } from '../../../lib/providers/StoreProvider';
import useLoadedData from '../../../lib/hooks/useLoadedData';

function NotConfirmedIcon() {
  return (
    <i
      className="fas fa-exclamation-circle"
      data-toggle="tooltip"
      data-placement="top"
      data-container="body"
      title="This competition is not confirmed yet."
    />
  );
}

function CollisionsTableHeaderRow() {
  return (
    <Table.Row>
      <Table.HeaderCell name="name" width={3}>
        {I18n.t('competitions.adjacent_competitions.name')}
      </Table.HeaderCell>
      <Table.HeaderCell name="delegates" width={3}>
        {I18n.t('competitions.adjacent_competitions.delegates')}
      </Table.HeaderCell>
      <Table.HeaderCell name="time" width={2}>
        {I18n.t('competitions.adjacent_competitions.time')}
      </Table.HeaderCell>
      <Table.HeaderCell name="location" width={2}>
        {I18n.t('competitions.adjacent_competitions.location')}
      </Table.HeaderCell>
    </Table.Row>
  );
}

/**
 * @typedef {Object} CompetitionData
 * @property {boolean} danger
 * @property {string} id
 * @property {string} name
 * @property {string} nameLink
 * @property {boolean} confirmed
 * @property {string} delegates
 * @property {string} registrationOpen
 * @property {number} minutesUntil
 * @property {string} cityName
 * @property {string} countryId
 * @property {string[]} events
 *
 * @param {CompetitionData} comp
 * @param {boolean} showEvents
 * @returns {JSX.Element}
 * @constructor
 */
function CollisionsTableCompRow({ comp, showEvents }) {
  return (
    <Table.Row warning={!comp.danger} error={comp.danger}>
      <Table.Cell name="name" width={3}>
        <span dangerouslySetInnerHTML={{ __html: comp.nameLink }} />
        {!comp.confirmed && <NotConfirmedIcon />}
      </Table.Cell>
      <Table.Cell name="delegates" width={2}>
        <span dangerouslySetInnerHTML={{ __html: comp.delegates }} />
      </Table.Cell>
      <Table.Cell
        name="time"
        width={2}
      >
        <Popup
          content={`${comp.name} ${I18n.t('competitions.colliding_registration_start_competitions.opens_registration_at')} ${new Date(comp.registrationOpen).toUTCString()}`}
          position="top center"
          size="tiny"
          trigger={(
            <span>
              {I18n.t('datetime.distance_in_words.x_minutes', { count: Math.abs(parseFloat(comp.minutesUntil)) })}
              {' '}
              {comp.minutesUntil < 0 ? I18n.t('competitions.adjacent_competitions.before') : I18n.t('competitions.adjacent_competitions.after')}
            </span>
          )}
        />
      </Table.Cell>
      <Table.Cell name="location" width={2}>
        {comp.cityName}
        {' '}
        {comp.countryId}
      </Table.Cell>
      {showEvents && (
        <Table.Cell name="events" width={2}>
          {comp.events.map((e) => (
            <Popup
              key={e}
              position="bottom center"
              size="tiny"
              content={events.byId[e].name}
              trigger={(
                <i
                  key={e}
                  className={`cubing-icon icon event-${e}`}
                />
              )}
            />
          ))}
        </Table.Cell>
      )}
    </Table.Row>
  );
}

function CollisionsTable({ comps }) {
  const [showEvents, setShowEvents] = useState(false);

  return (
    <Table structured>
      <Table.Header>
        <CollisionsTableHeaderRow />
      </Table.Header>
      <Table.Body>
        {comps.slice().reverse().map((comp) => (
          <CollisionsTableCompRow
            key={comp.name}
            comp={comp}
            showEvents={showEvents}
          />
        ))}
      </Table.Body>
      <Table.Footer fullWidth>
        <Table.Row>
          <Table.HeaderCell colSpan="16">
            <Button
              floated="right"
              size="mini"
              primary
              onClick={() => setShowEvents(!showEvents)}
            >
              {showEvents ? 'Hide Events' : 'Show Events'}
            </Button>
          </Table.HeaderCell>
        </Table.Row>
      </Table.Footer>
    </Table>
  );
}

function MissingInfo() {
  return (
    <Message negative>
      <p>{I18n.t('competitions.colliding_registration_start_competitions.no_registration_start_date_yet')}</p>
    </Message>
  );
}

function RegistrationCollisionsContent() {
  const {
    competition: {
      id,
      registration_open,
    },
  } = useStore();

  const savedParams = useMemo(() => {
    const params = new URLSearchParams();

    if (!registration_open) return params;

    params.append('id', id);
    params.append('registration_open', registration_open);

    return params;
  }, [id, registration_open]);

  const registrationCollisionsUrl = useMemo(
    () => `${registrationCollisionsJsonUrl}?${savedParams.toString()}`,
    [savedParams],
  );

  const {
    data: collisions,
    loading,
    error,
    sync,
  } = useLoadedData(registrationCollisionsUrl);

  if (loading) {
    return <Loading />;
  }

  if (!registration_open) return <MissingInfo />;

  if (!collisions || collisions.length === 0) {
    return (
      <Message positive>
        {I18n.t('competitions.colliding_registration_start_competitions.no_comp_colliding')}
      </Message>
    );
  }

  return <CollisionsTable comps={collisions} />;
}

export default function RegistrationCollisions() {
  const label = I18n.t('competitions.colliding_registration_start_competitions.label', { hours: 3 });

  return (
    <TableWrapper label={label}>
      <RegistrationCollisionsContent />
    </TableWrapper>
  );
}
