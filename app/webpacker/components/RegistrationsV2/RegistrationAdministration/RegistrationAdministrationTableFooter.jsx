import _ from 'lodash';
import { Table } from 'semantic-ui-react';
import React from 'react';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';
import I18n from '../../../lib/i18n';

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
  isReadOnly = false,
}) {
  const {
    dob: dobIsShown, events: eventsAreExpanded, comments: commentsAreShown,
  } = columnsExpanded;

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

  const getColSpan = () => {
    if (isReadOnly) return 2;
    if (withPosition) return 5;
    return 4;
  };

  const firstColSpan = getColSpan();

  return (
    <Table.Row>
      <Table.Cell colSpan={firstColSpan}>
        {
          `${
            newcomerCount
          } ${
            I18n.t('registrations.registration_info_people.newcomer', { count: newcomerCount })
          } + ${
            registrations.length - newcomerCount
          } ${
            I18n.t('registrations.registration_info_people.returner', { count: registrations.length - newcomerCount })
          } = ${
            registrations.length
          } ${
            I18n.t('registrations.registration_info_people.person', { count: registrations.length })
          }`
        }
      </Table.Cell>
      {dobIsShown && <Table.Cell key="dob" />}
      <Table.Cell>
        {`${I18n.t('registrations.list.country_plural', { count: countryCount })}`}
      </Table.Cell>
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
