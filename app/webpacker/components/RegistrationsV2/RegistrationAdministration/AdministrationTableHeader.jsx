import { Checkbox, Table } from 'semantic-ui-react';
import React from 'react';
import I18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';

/**
 * @param {{sortState: {column: string, direction: 'ascending' | 'descending'}}} props
 */
export default function TableHeader({
  columnsExpanded,
  isChecked,
  onCheckboxChanged,
  sortState,
  onColumnClick,
  competitionInfo,
  withCheckbox = true,
  withPosition = false,
}) {
  const {
    dob: dobIsShown, events: eventsAreExpanded, comments: commentsAreShown,
  } = columnsExpanded;

  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell disabled>
          {withCheckbox && (
            <Checkbox checked={isChecked} onChange={onCheckboxChanged} />
          )}
        </Table.HeaderCell>
        {withPosition && (
          <Table.HeaderCell disabled>#</Table.HeaderCell>
        )}
        <Table.HeaderCell disabled />
        <Table.HeaderCell
          sorted={sortState.column === 'wca_id' ? sortState.direction : undefined}
          onClick={() => onColumnClick('wca_id')}
        >
          {I18n.t('common.user.wca_id')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortState.column === 'name' ? sortState.direction : undefined}
          onClick={() => onColumnClick('name')}
        >
          {I18n.t('delegates_page.table.name')}
        </Table.HeaderCell>
        {dobIsShown && (
          <Table.HeaderCell
            sorted={sortState.column === 'dob' ? sortState.direction : undefined}
            onClick={() => onColumnClick('dob')}
          >
            {I18n.t('activerecord.attributes.user.dob')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortState.column === 'country' ? sortState.direction : undefined}
          onClick={() => onColumnClick('country')}
        >
          {I18n.t('common.user.representing')}
        </Table.HeaderCell>
        {competitionInfo['using_payment_integrations?'] ? (
          <>
            <Table.HeaderCell
              sorted={sortState.column === 'paid_on_with_registered_on_fallback' ? sortState.direction : undefined}
              onClick={() => onColumnClick('paid_on_with_registered_on_fallback')}
            >
              {I18n.t('registrations.list.registered.with_stripe')}
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortState.column === 'amount' ? sortState.direction : undefined}
              onClick={() => onColumnClick('amount')}
            >
              {I18n.t('competitions.registration_v2.update.amount')}
            </Table.HeaderCell>
          </>
        ) : (
          <Table.HeaderCell
            sorted={sortState.column === 'registered_on' ? sortState.direction : undefined}
            onClick={() => onColumnClick('registered_on')}
          >
            {I18n.t('registrations.list.registered.without_stripe')}
          </Table.HeaderCell>
        )}
        {eventsAreExpanded ? (
          competitionInfo.event_ids.map((eventId) => (
            <Table.HeaderCell
              key={`event-${eventId}`}
              sorted={sortState.column === eventId ? sortState.direction : undefined}
              onClick={() => onColumnClick(eventId)}
            >
              <EventIcon id={eventId} size="1em" />
            </Table.HeaderCell>
          ))
        ) : (
          <Table.HeaderCell
            sorted={sortState.column === 'events' ? sortState.direction : undefined}
            onClick={() => onColumnClick('events')}
          >
            {I18n.t('competitions.competition_info.events')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortState.column === 'guests' ? sortState.direction : undefined}
          onClick={() => onColumnClick('guests')}
        >
          {I18n.t(
            'competitions.competition_form.labels.registration.guests_enabled',
          )}
        </Table.HeaderCell>
        {commentsAreShown && (
          <>
            <Table.HeaderCell
              sorted={sortState.column === 'comment' ? sortState.direction : undefined}
              onClick={() => onColumnClick('comment')}
            >
              {I18n.t('activerecord.attributes.registration.comments')}
            </Table.HeaderCell>
            <Table.HeaderCell disabled>
              {I18n.t('activerecord.attributes.registration.administrative_notes')}
            </Table.HeaderCell>
          </>
        )}
        <Table.HeaderCell disabled>{I18n.t('registrations.list.email')}</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}
