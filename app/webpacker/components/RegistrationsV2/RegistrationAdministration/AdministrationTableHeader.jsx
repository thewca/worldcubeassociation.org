import { Checkbox, Table } from 'semantic-ui-react';
import React from 'react';
import I18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';

export default function TableHeader({
  columnsExpanded,
  isChecked,
  onCheckboxChanged,
  sortDirection,
  sortColumn,
  changeSortColumn,
  competitionInfo,
  withCheckbox = true,
}) {
  const {
    dob: dobIsShown, events: eventsAreExpanded, comments: commentsAreShown,
  } = columnsExpanded;

  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>
          {withCheckbox && (
            <Checkbox checked={isChecked} onChange={onCheckboxChanged} />
          )}
        </Table.HeaderCell>
        <Table.HeaderCell />
        <Table.HeaderCell
          sorted={sortColumn === 'wca_id' ? sortDirection : undefined}
          onClick={() => changeSortColumn('wca_id')}
        >
          {I18n.t('common.user.wca_id')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortColumn === 'name' ? sortDirection : undefined}
          onClick={() => changeSortColumn('name')}
        >
          {I18n.t('delegates_page.table.name')}
        </Table.HeaderCell>
        {dobIsShown && (
          <Table.HeaderCell
            sorted={sortColumn === 'dob' ? sortDirection : undefined}
            onClick={() => changeSortColumn('dob')}
          >
            {I18n.t('activerecord.attributes.user.dob')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortColumn === 'country' ? sortDirection : undefined}
          onClick={() => changeSortColumn('country')}
        >
          {I18n.t('common.user.representing')}
        </Table.HeaderCell>
        {competitionInfo['using_payment_integrations?'] ? (
          <>
            <Table.HeaderCell
              sorted={sortColumn === 'paid_on_with_registered_on_fallback' ? sortDirection : undefined}
              onClick={() => changeSortColumn('paid_on_with_registered_on_fallback')}
            >
              {I18n.t('registrations.list.registered.with_stripe')}
            </Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('competitions.registration_v2.update.amount')}</Table.HeaderCell>
          </>
        ) : (
          <Table.HeaderCell
            sorted={sortColumn === 'registered_on' ? sortDirection : undefined}
            onClick={() => changeSortColumn('registered_on')}
          >
            {I18n.t('registrations.list.registered.without_stripe')}
          </Table.HeaderCell>
        )}
        {eventsAreExpanded ? (
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
            {I18n.t('competitions.competition_info.events')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortColumn === 'guests' ? sortDirection : undefined}
          onClick={() => changeSortColumn('guests')}
        >
          {I18n.t(
            'competitions.competition_form.labels.registration.guests_enabled',
          )}
        </Table.HeaderCell>
        {commentsAreShown && (
          <>
            <Table.HeaderCell
              sorted={sortColumn === 'comment' ? sortDirection : undefined}
              onClick={() => changeSortColumn('comment')}
            >
              {I18n.t('activerecord.attributes.registration.comments')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {I18n.t('activerecord.attributes.registration.administrative_notes')}
            </Table.HeaderCell>
          </>
        )}
        <Table.HeaderCell>{I18n.t('registrations.list.email')}</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}
