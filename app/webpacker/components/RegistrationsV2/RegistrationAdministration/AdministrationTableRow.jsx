import {
  Checkbox, Flag, Icon, Popup, Ref, Table,
} from 'semantic-ui-react';
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { setMessage } from '../Register/RegistrationMessage';
import i18n from '../../../lib/i18n';
import {
  getRegistrationTimestamp,
  getShortDateString,
} from '../../../lib/utils/dates';
import EventIcon from '../../wca/EventIcon';
import { editRegistrationUrl, editPersonUrl, personUrl } from '../../../lib/requests/routes.js.erb';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';
import { countries } from "../../../lib/wca-data.js.erb";

// Semantic Table only allows truncating _all_ columns in a table in
// single line fixed mode. As we only want to truncate the comment/admin notes
// this function is used to manually truncate the columns.
// TODO: We could fix this by building our own table component here
const truncateComment = (comment) => (comment?.length > 12 ? `${comment.slice(0, 12)}...` : comment);

function RegistrationTime({
  timestamp, registeredOn, paymentStatuses, paidOn, usesPaymentIntegration,
}) {
  if (timestamp) {
    return getRegistrationTimestamp(paidOn ?? registeredOn);
  }

  const mostRecentPaymentStatus = paymentStatuses[0]

  if (usesPaymentIntegration && mostRecentPaymentStatus !== 'succeeded') {
    let content = i18n.t('registrations.list.payment_requested_on', { date: getRegistrationTimestamp(registeredOn) });
    let trigger = <span>{i18n.t('registrations.list.not_paid')}</span>;

    if (mostRecentPaymentStatus === 'initialized') {
      content = i18n.t('competitions.registration_v2.list.payment.initialized', { date: getRegistrationTimestamp(paidOn) });
    }

    if (mostRecentPaymentStatus === 'refund') {
      content = i18n.t('competitions.registration_v2.list.payment.refunded', { date: getRegistrationTimestamp(paidOn) });
      trigger = <span>{i18n.t('competitions.registration_v2.list.payment.refunded_status')}</span>;
    }

    return (
      <Popup
        content={content}
        trigger={trigger}
      />
    );
  }

  return (
    <Popup
      content={getRegistrationTimestamp(paidOn ?? registeredOn)}
      trigger={<span>{getShortDateString(paidOn ?? registeredOn)}</span>}
    />
  );
}

export default function TableRow({
  columnsExpanded,
  registration,
  isSelected,
  onCheckboxChange,
  competitionInfo,
  index,
  draggable = false,
}) {
  const {
    dob, region, events, comments, email, timestamp,
  } = columnsExpanded;
  const {
    id, wca_id: wcaId, name, country,
  } = registration.user;
  const {
    registered_on: registeredOn, event_ids: eventIds, comment, admin_comment: adminComment,
  } = registration.competing;
  const { dob: dateOfBirth, email: emailAddress } = registration;
  const {
    payment_amount_iso: paymentAmount,
    updated_at: updatedAt,
    payment_status: paymentStatuses,
    has_paid: hasPaid,
  } = registration.payment;

  const copyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setMessage('Copied email address to clipboard.', 'positive');
  };
  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Draggable
      key={registration.user_id.toString()}
      draggableId={registration.user_id.toString()}
      index={index}
      isDragDisabled={!draggable}
    >
      {(provided) => (
        <Ref innerRef={provided.innerRef}>
          <Table.Row
            key={id}
            active={isSelected}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <Table.Cell>
              { /* We manually set the margin to 0 here to fix the table row height */}
              {draggable ? <Icon name="bars" /> : <Checkbox onChange={onCheckboxChange} checked={isSelected} style={{ margin: 0 }} />}
            </Table.Cell>

            <Table.Cell>
              <a href={editRegistrationUrl(id, competitionInfo.id)}>
                {i18n.t('registrations.list.edit')}
              </a>
            </Table.Cell>

            <Table.Cell>
              {wcaId ? (
                <a href={personUrl(wcaId)}>{wcaId}</a>
              ) : (
                <a href={editPersonUrl(id)}>
                  <Icon name="edit" />
                  {i18n.t('users.edit.profile')}
                </a>
              )}
            </Table.Cell>

            <Table.Cell>{name}</Table.Cell>

            {dob && <Table.Cell>{dateOfBirth}</Table.Cell>}

            <Table.Cell>
              {region ? (
                <>
                  <Flag name={country.iso2.toLowerCase()} />
                  {region && countries.byIso2[country.iso2].name}
                </>
              ) : (
                <Popup
                  content={countries.byIso2[country.iso2].name}
                  trigger={(
                    <span>
                      <Flag name={country.iso2.toLowerCase()} />
                    </span>
            )}
                />
              )}
            </Table.Cell>

            <Table.Cell>
              <RegistrationTime
                timestamp={timestamp}
                paidOn={updatedAt}
                registeredOn={registeredOn}
                paymentStatuses={paymentStatuses}
                usesPaymentIntegration={competitionInfo['using_payment_integrations?']}
              />
            </Table.Cell>

            {competitionInfo['using_payment_integrations?'] && (
            <Table.Cell>
              {hasPaid
                ? isoMoneyToHumanReadable(paymentAmount, competitionInfo.currency_code)
                : ''}
            </Table.Cell>
            )}

            {events ? (
              competitionInfo.event_ids.map((eventId) => (
                <Table.Cell key={`event-${eventId}`}>
                  {eventIds.includes(eventId) && (
                  <EventIcon id={eventId} size="1em" />
                  )}
                </Table.Cell>
              ))
            ) : (
              <Popup
                content={eventIds.map((eventId) => (
                  <EventIcon key={eventId} id={eventId} size="1em" />
                ))}
                position="top center"
                trigger={(
                  <Table.Cell>
                    <span>
                      {eventIds.length}
                      {' '}
                      <Icon name="magnify" />
                    </span>
                  </Table.Cell>
          )}
              />

            )}

            <Table.Cell>{registration.guests}</Table.Cell>

            {comments && (
            <>
              <Table.Cell>
                <Popup
                  content={comment}
                  trigger={<span>{truncateComment(comment)}</span>}
                />
              </Table.Cell>

              <Table.Cell>
                <Popup
                  content={adminComment}
                  trigger={<span>{truncateComment(adminComment)}</span>}
                />
              </Table.Cell>
            </>
            )}

            <Table.Cell>
              <a href={`mailto:${emailAddress}`}>
                {email ? (
                  emailAddress
                ) : (
                  <Popup
                    content={emailAddress}
                    trigger={(
                      <span>
                        <Icon name="mail" />
                      </span>
              )}
                  />
                )}
              </a>
              {' '}
              <Icon link onClick={copyEmail} name="copy" title={i18n.t('competitions.registration_v2.update.email_copy')} />
            </Table.Cell>
          </Table.Row>
        </Ref>
      )}
    </Draggable>
  );
}
