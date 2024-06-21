import { Checkbox, Table } from 'semantic-ui-react';
import React from 'react';
import i18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';

export default function TableHeader({
  columnsExpanded,
  isChecked,
  onCheckboxChanged,
  sortDirection,
  sortColumn,
  changeSortColumn,
  competitionInfo,
}) {
  const { dob, events, comments } = columnsExpanded;

  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>
          <Checkbox checked={isChecked} onChange={onCheckboxChanged} />
        </Table.HeaderCell>
        <Table.HeaderCell />
        <Table.HeaderCell
          sorted={sortColumn === 'wca_id' ? sortDirection : undefined}
          onClick={() => changeSortColumn('wca_id')}
        >
          {i18n.t('common.user.wca_id')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortColumn === 'name' ? sortDirection : undefined}
          onClick={() => changeSortColumn('name')}
        >
          {i18n.t('delegates_page.table.name')}
        </Table.HeaderCell>
        {dob && (
          <Table.HeaderCell
            sorted={sortColumn === 'dob' ? sortDirection : undefined}
            onClick={() => changeSortColumn('dob')}
          >
            {i18n.t('activerecord.attributes.user.dob')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortColumn === 'country' ? sortDirection : undefined}
          onClick={() => changeSortColumn('country')}
        >
          {i18n.t('common.user.representing')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortColumn === 'registered_on' ? sortDirection : undefined}
          onClick={() => changeSortColumn('registered_on')}
        >
          {i18n.t('registrations.list.registered.without_stripe')}
        </Table.HeaderCell>
        {competitionInfo['using_payment_integrations?'] && (
          <>
            <Table.HeaderCell>Payment Status</Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'paid_on_with_registered_on_fallback' ? sortDirection : undefined}
              onClick={() => changeSortColumn('paid_on_with_registered_on_fallback')}
            >
              {i18n.t('registrations.list.registered.with_stripe')}
            </Table.HeaderCell>
          </>
        )}
        {events ? (
          competitionInfo.event_ids.map((eventId) => (
            <Table.HeaderCell key={`event-${eventId}`}>
              <EventIcon id={eventId} size="1em" />
            </Table.HeaderCell>
          ))
        ) : (
          <Table.HeaderCell
            sorted={sortColumn === 'events' ? sortDirection : undefined}
            onClick={() => changeSortColumn('events')}
          >
            {i18n.t('competitions.competition_info.events')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortColumn === 'guests' ? sortDirection : undefined}
          onClick={() => changeSortColumn('guests')}
        >
          {i18n.t(
            'competitions.competition_form.labels.registration.guests_enabled',
          )}
        </Table.HeaderCell>
        {comments && (
          <>
            <Table.HeaderCell
              sorted={sortColumn === 'comment' ? sortDirection : undefined}
              onClick={() => changeSortColumn('comment')}
            >
              {i18n.t('activerecord.attributes.registration.comments')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {i18n.t('activerecord.attributes.registration.administrative_notes')}
            </Table.HeaderCell>
          </>
        )}
        <Table.HeaderCell>{i18n.t('registrations.list.email')}</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}
