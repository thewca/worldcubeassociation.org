import { Checkbox, Table } from 'semantic-ui-react';
import React from 'react';
import I18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';

function PaymentHeaders({
  usingManualPayments, sortColumn, onColumnClick, sortDirection,
}) {
  if (usingManualPayments) {
    return (
      <>
        <Table.HeaderCell
          sorted={sortColumn === 'paid_on_with_registered_on_fallback' ? sortDirection : undefined}
          onClick={() => onColumnClick('paid_on_with_registered_on_fallback')}
        >
          {I18n.t('registrations.list.registered.without_stripe')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortColumn === 'payment_reference' ? sortDirection : undefined}
          onClick={() => onColumnClick('payment_reference')}
        >
          {I18n.t('competitions.registration_v2.list.payment.payment_reference')}
        </Table.HeaderCell>
      </>
    );
  }
  return (
    <>
      <Table.HeaderCell
        sorted={sortColumn === 'paid_on_with_registered_on_fallback' ? sortDirection : undefined}
        onClick={() => onColumnClick('paid_on_with_registered_on_fallback')}
      >
        {I18n.t('registrations.list.registered.with_stripe')}
      </Table.HeaderCell>
      <Table.HeaderCell
        sorted={sortColumn === 'amount' ? sortDirection : undefined}
        onClick={() => onColumnClick('amount')}
      >
        {I18n.t('competitions.registration_v2.update.amount')}
      </Table.HeaderCell>
    </>
  );
}

export default function TableHeader({
  columnsExpanded,
  isChecked,
  onCheckboxChanged,
  sortDirection,
  sortColumn,
  onColumnClick,
  competitionInfo,
  withCheckbox = true,
  withPosition = false,
}) {
  const {
    dob: dobIsShown, events: eventsAreExpanded, comments: commentsAreShown,
  } = columnsExpanded;

  const usingPayments = competitionInfo['using_payment_integrations?'];
  const usingManualPayments = usingPayments && competitionInfo.payment_integration_type === 'manual';

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
          sorted={sortColumn === 'wca_id' ? sortDirection : undefined}
          onClick={() => onColumnClick('wca_id')}
        >
          {I18n.t('common.user.wca_id')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortColumn === 'name' ? sortDirection : undefined}
          onClick={() => onColumnClick('name')}
        >
          {I18n.t('delegates_page.table.name')}
        </Table.HeaderCell>
        {dobIsShown && (
          <Table.HeaderCell
            sorted={sortColumn === 'dob' ? sortDirection : undefined}
            onClick={() => onColumnClick('dob')}
          >
            {I18n.t('activerecord.attributes.user.dob')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortColumn === 'country' ? sortDirection : undefined}
          onClick={() => onColumnClick('country')}
        >
          {I18n.t('common.user.representing')}
        </Table.HeaderCell>
        {usingPayments ? (
          <PaymentHeaders
            onColumnClick={onColumnClick}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            usingManualPayments={usingManualPayments}
          />
        ) : (
          <Table.HeaderCell
            sorted={sortColumn === 'registered_on' ? sortDirection : undefined}
            onClick={() => onColumnClick('registered_on')}
          >
            {I18n.t('registrations.list.registered.without_stripe')}
          </Table.HeaderCell>
        )}
        {eventsAreExpanded ? (
          competitionInfo.event_ids.map((eventId) => (
            <Table.HeaderCell
              key={`event-${eventId}`}
              sorted={sortColumn === eventId ? sortDirection : undefined}
              onClick={() => onColumnClick(eventId)}
            >
              <EventIcon id={eventId} size="1em" />
            </Table.HeaderCell>
          ))
        ) : (
          <Table.HeaderCell
            sorted={sortColumn === 'events' ? sortDirection : undefined}
            onClick={() => onColumnClick('events')}
          >
            {I18n.t('competitions.competition_info.events')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortColumn === 'guests' ? sortDirection : undefined}
          onClick={() => onColumnClick('guests')}
        >
          {I18n.t(
            'competitions.competition_form.labels.registration.guests_enabled',
          )}
        </Table.HeaderCell>
        {commentsAreShown && (
          <>
            <Table.HeaderCell
              sorted={sortColumn === 'comment' ? sortDirection : undefined}
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
