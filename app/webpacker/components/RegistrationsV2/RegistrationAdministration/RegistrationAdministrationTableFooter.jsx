import _ from 'lodash';
import { Table } from 'semantic-ui-react';
import React from 'react';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

export default function RegistrationAdministrationTableFooter({
  registrations, competitionInfo,
  eventsToggled,
}) {
  const newcomerCount = registrations.filter(
    (reg) => !reg.user.wca_id,
  ).length;

  const countryCount = new Set(
    registrations.map((reg) => reg.user.country.iso2),
  ).size;

  const guestCount = _.sum(registrations.map((r) => r.guests));

  const moneyCount = _.sum(registrations.filter(
    (r) => r.payment.payment_amount_iso,
  ).map((r) => r.payment.payment_amount_iso));

  const moneyCountHumanReadable = isoMoneyToHumanReadable(
    moneyCount,
    competitionInfo.currency_code,
  );

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
      <Table.Cell colSpan={4}>
        {`${newcomerCount} First-Timers + ${
          registrations.length - newcomerCount
        } Returners = ${registrations.length} People`}
      </Table.Cell>
      <Table.Cell>{`${countryCount}  Countries`}</Table.Cell>
      <Table.Cell />
      { competitionInfo['using_payment_integrations?'] && <Table.Cell>{moneyCountHumanReadable}</Table.Cell>}
      { eventsToggled ? competitionInfo.event_ids.map((evt) => (
        <Table.Cell key={`footer-count-${evt}`}>
          {eventCounts[evt]}
        </Table.Cell>
      )) : <Table.Cell />}
      <Table.Cell>{guestCount}</Table.Cell>
      <Table.Cell />
      <Table.Cell />
      <Table.Cell />
      <Table.Cell />
    </Table.Row>
  );
}
