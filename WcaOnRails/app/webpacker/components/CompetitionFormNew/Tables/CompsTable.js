/* eslint-disable react/no-danger */
import React, { useState } from 'react';
import {
  Button, Table, Message,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { events } from '../../../lib/wca-data.js.erb';

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

function CompsTableHeaderRow({ showEvents }) {
  return (
    <Table.Row>
      <Table.HeaderCell name="name" width={3}>
        {I18n.t('competitions.adjacent_competitions.name')}
      </Table.HeaderCell>
      <Table.HeaderCell name="delegates" width={3}>
        {I18n.t('competitions.adjacent_competitions.delegates')}
      </Table.HeaderCell>
      <Table.HeaderCell name="date" width={2}>
        {I18n.t('competitions.adjacent_competitions.date')}
      </Table.HeaderCell>
      <Table.HeaderCell name="location" width={2}>
        {I18n.t('competitions.adjacent_competitions.location')}
      </Table.HeaderCell>
      <Table.HeaderCell name="distance" width={1}>
        {I18n.t('competitions.adjacent_competitions.distance')}
      </Table.HeaderCell>
      <Table.HeaderCell name="limit" width={1}>
        {I18n.t('competitions.adjacent_competitions.limit')}
      </Table.HeaderCell>
      <Table.HeaderCell name="competitors" width={1}>
        {I18n.t('competitions.adjacent_competitions.competitors')}
      </Table.HeaderCell>
      {showEvents && (
        <Table.HeaderCell name="events" width={2}>
          {I18n.t('competitions.adjacent_competitions.events')}
        </Table.HeaderCell>
      )}
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
 * @property {number} daysUntil
 * @property {string} location
 * @property {string} distance
 * @property {string} limit
 * @property {string} competitors
 * @property {string[]} events
 * @property {Object} coordinates
 * @property {number} coordinates.lat
 * @property {number} coordinates.long
 *
 * @param {CompetitionData} comp
 * @param action
 * @param showEvents
 * @returns {JSX.Element}
 * @constructor
 */
function CompsTableCompRow({ comp, action, showEvents }) {
  return (
    <Table.Row warning={!comp.danger} error={comp.danger}>
      <Table.Cell name="name" width={3}>
        <span dangerouslySetInnerHTML={{ __html: comp.nameLink }} />
        {!comp.confirmed && <NotConfirmedIcon />}
        {action && (
        <>
          <br />
          <Button
            size="mini"
            onClick={() => action.onClick(comp)}
          >
            {action.label}
          </Button>
        </>
        )}
      </Table.Cell>
      <Table.Cell name="delegates" width={2}>
        <span dangerouslySetInnerHTML={{ __html: comp.delegates }} />
      </Table.Cell>
      <Table.Cell
        name="date"
        width={2}
        data-toggle="tooltip"
        data-placement="top"
        data-container="body"
        title={`${comp.name} ${comp.days_until < 0
          ? `${I18n.t('competitions.adjacent_competitions.ends_on')} ${comp.end_date}`
          : `${I18n.t('competitions.adjacent_competitions.starts_on')} ${comp.start_date}`}`}
      >
        {I18n.t('datetime.distance_in_words.x_days', { count: Math.abs(comp.daysUntil) })}
        {' '}
        {comp.daysUntil < 0 ? I18n.t('competitions.adjacent_competitions.before') : I18n.t('competitions.adjacent_competitions.after')}
      </Table.Cell>
      <Table.Cell name="location" width={2}>
        {comp.location}
      </Table.Cell>
      <Table.Cell name="distance" width={2} singleLine>
        <span dangerouslySetInnerHTML={{ __html: comp.distance }} />
      </Table.Cell>
      <Table.Cell name="limit" width={1}>
        {comp.limit ? comp.limit : '-'}
      </Table.Cell>
      <Table.Cell name="competitors" width={1}>
        {comp.competitors ? comp.competitors : '-'}
      </Table.Cell>
      {showEvents && (
        <Table.Cell name="events" width={2}>
          {comp.events.map((e) => (
            <i
              key={e}
              data-toggle="tooltip"
              data-placement="bottom"
              data-container="body"
              title=""
              className={`cubing-icon icon event-${e}`}
              data-original-title={events.byId[e].name}
            />
          ))}
        </Table.Cell>
      )}
    </Table.Row>
  );
}

function CompsTableContent({ comps, action }) {
  const [showEvents, setShowEvents] = useState(false);

  return (
    <Table structured>
      <Table.Header>
        <CompsTableHeaderRow showEvents={showEvents} />
      </Table.Header>
      <Table.Body>
        {comps.reverse().map((comp) => (
          <CompsTableCompRow
            key={comp.name}
            comp={comp}
            showEvents={showEvents}
            action={action}
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

export default function CompsTable({
  comps, action,
}) {
  if (!comps || comps.length === 0) {
    return (
      <Message positive>
        {I18n.t('competitions.adjacent_competitions.no_comp_nearby')}
      </Message>
    );
  }

  return <CompsTableContent comps={comps.reverse()} action={action} />;
}
