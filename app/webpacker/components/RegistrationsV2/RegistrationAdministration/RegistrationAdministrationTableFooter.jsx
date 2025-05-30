import _ from 'lodash';
import { Table } from 'semantic-ui-react';
import React from 'react';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

const moneyCountHumanReadable = (registrations, competitionInfo) => {
  const moneyCount = _.sum(registrations.map((r) => r.payment.paid_amount_iso));

  return isoMoneyToHumanReadable(
    moneyCount,
    competitionInfo.currency_code,
  );
};

export default function RegistrationAdministrationTableFooter({
  columnsExpanded,
  registrations,
  competitionInfo,
  withPosition = false,
}) {
  const { events: eventsAreExpanded, comments: commentsAreShown } = columnsExpanded;

  const newcomerCount = registrations.filter(
    (reg) => !reg.user.wca_id,
  ).length;

  const countryCount = new Set(
    registrations
      .map((reg) => reg.user.country?.iso2)
      .filter(Boolean),
  ).size;

  const guestCount = _.sum(registrations.map((r) => r.guests));

  const eventCounts = Object.fromEntries(
    competitionInfo.event_ids.map((evt) => {
      const competingCount = registrations.filter(
        (reg) => reg.competing.event_ids.includes(evt),
      ).length;

      return [evt, competingCount];
    }),
  );

  return (
    <Table.Row>
      <Table.Cell colSpan={withPosition ? 5 : 4}>
        {`${newcomerCount} First-Timers + ${
          registrations.length - newcomerCount
        } Returners = ${registrations.length} People`}
      </Table.Cell>
      <Table.Cell>{`${countryCount} Countries`}</Table.Cell>
      <Table.Cell key="registered on" />
      {competitionInfo['using_payment_integrations?'] && (
        <Table.Cell>{moneyCountHumanReadable(registrations, competitionInfo)}</Table.Cell>
      )}
      {eventsAreExpanded ? (
        competitionInfo.event_ids.map((evt) => (
          <Table.Cell key={`footer-count-${evt}`}>
            {eventCounts[evt]}
          </Table.Cell>
        ))
      ) : (
        <Table.Cell />
      )}
      <Table.Cell>{guestCount}</Table.Cell>
      {commentsAreShown && (
        <>
          <Table.Cell key="comment" />
          <Table.Cell key="note" />
        </>
      )}
      <Table.Cell key="email" />
    </Table.Row>
  );
}
