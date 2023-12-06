/* eslint-disable react/no-danger */
import React from 'react';
import {
  Button, Table, Message, Popup, TableCell,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { events } from '../../../lib/wca-data.js.erb';
import useToggleState from '../../../lib/hooks/useToggleState';

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
 * @property {string} startDate
 * @property {string} endDate
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
      <TableCell name="date" width={2}>
        <Popup
          content={
            `${comp.name} ${comp.daysUntil < 0
              ? `${I18n.t('competitions.adjacent_competitions.ends_on')} ${comp.endDate}`
              : `${I18n.t('competitions.adjacent_competitions.starts_on')} ${comp.startDate}`}`
          }
          position="top center"
          size="tiny"
          trigger={(
            <span>
              {I18n.t('datetime.distance_in_words.x_days', { count: Math.abs(comp.daysUntil) })}
              {' '}
              {comp.daysUntil < 0 ? I18n.t('competitions.adjacent_competitions.before') : I18n.t('competitions.adjacent_competitions.after')}
            </span>
          )}
        />
      </TableCell>
      <Table.Cell name="location" width={2}>
        {comp.location}
      </Table.Cell>
      <Table.Cell name="distance" width={2} singleLine>
        <a
          href={`https://www.google.com/maps/dir/${comp.distance.from.lat},${comp.distance.from.long}/${comp.distance.to.lat},${comp.distance.to.long}/`}
          target="_blank"
          rel="noreferrer"
        >
          {`${comp.distance.km} km`}
        </a>
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

function CompsTableContent({ comps, action }) {
  const [showEvents, setShowEvents] = useToggleState(false);

  return (
    <Table structured>
      <Table.Header>
        <CompsTableHeaderRow showEvents={showEvents} />
      </Table.Header>
      <Table.Body>
        {comps.map((comp) => (
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
              toggle
              floated="right"
              size="mini"
              active={showEvents}
              onClick={setShowEvents}
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

  return <CompsTableContent comps={comps} action={action} />;
}
