import {
  Checkbox, Icon, Popup, Ref, Table,
} from 'semantic-ui-react';
import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { showMessage } from '../Register/RegistrationMessage';
import I18n from '../../../lib/i18n';
import {
  getRegistrationTimestamp,
  getShortDateString,
} from '../../../lib/utils/dates';
import EventIcon from '../../wca/EventIcon';
import { editRegistrationUrl, editPersonUrl, personUrl } from '../../../lib/requests/routes.js.erb';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';
import { countries } from '../../../lib/wca-data.js.erb';
import RegionFlag from '../../wca/RegionFlag';

// Semantic Table only allows truncating _all_ columns in a table in
// single line fixed mode. As we only want to truncate the comment/admin notes
// this function is used to manually truncate the columns.
// TODO: We could fix this by building our own table component here
const truncateComment = (comment) => (comment?.length > 12 ? `${comment.slice(0, 12)}...` : comment);

const formatDate = (date, withFullDate) => (
  withFullDate ? getRegistrationTimestamp(date) : getShortDateString(date)
);

function RegisteredOn({
  withFullDate, registeredOn,
}) {
  return (
    <Popup
      // trigger must be wrapped in a span, literal text causes a crash
      trigger={<span>{formatDate(registeredOn, withFullDate)}</span>}
      content={getRegistrationTimestamp(registeredOn)}
    />
  );
}

function PaidOn({
  withFullDate, registeredOn, paymentStatus, hasPaid, updatedAt,
}) {
  const wasRefunded = paymentStatus === 'refund';
  const trigger = (
    <span>
      {hasPaid
        ? `${formatDate(updatedAt, withFullDate)}${wasRefunded ? '*' : ''}`
        : I18n.t('registrations.list.not_paid')}
    </span>
  );

  const content = (() => {
    if (!hasPaid) {
      return I18n.t('registrations.list.payment_requested_on', { date: getRegistrationTimestamp(registeredOn) });
    }
    if (paymentStatus === 'initialized') {
      return I18n.t('competitions.registration_v2.list.payment.initialized', { date: getRegistrationTimestamp(updatedAt) });
    }
    if (paymentStatus === 'refund') {
      return I18n.t('competitions.registration_v2.list.payment.refunded', { date: getRegistrationTimestamp(updatedAt) });
    }
    // the above cases should be exhaustive
    return getRegistrationTimestamp(updatedAt);
  })();

  return (
    <Popup content={content} trigger={trigger} />
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
  withPosition = false,
  color,
  distinguishPaidUnpaid = false,
}) {
  const {
    dob: dobIsShown,
    region: regionIsExpanded,
    events: eventsAreExpanded,
    comments: commentsAreShown,
    email: emailIsExpanded,
    timestamp: dateIsExpanded,
  } = columnsExpanded;
  const {
    id: userId, wca_id: wcaId, name, country, dob: dateOfBirth, email: emailAddress,
  } = registration.user;
  const {
    registered_on: registeredOn,
    event_ids: eventIds,
    comment,
    admin_comment: adminComment,
    waiting_list_position: position,
  } = registration.competing;
  const {
    paid_amount_iso: paymentAmount,
    updated_at: updatedAt,
    payment_status: paymentStatus,
    has_paid: hasPaid,
  } = registration.payment ?? {};
  const usingPayment = competitionInfo['using_payment_integrations?'];
  const checkboxCellColor = !distinguishPaidUnpaid || !usingPayment || hasPaid
    ? color
    : undefined;

  const copyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    showMessage('Copied email address to clipboard.', 'positive');
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
            key={userId}
            active={isSelected}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <Table.Cell className={checkboxCellColor}>
              { /* We manually set the margin to 0 here to fix the table row height */}
              {draggable ? (
                <Icon name="bars" />
              ) : (
                <Checkbox onChange={onCheckboxChange} checked={isSelected} style={{ margin: 0 }} />
              )}
            </Table.Cell>

            {withPosition && (
              <Table.Cell>{position}</Table.Cell>
            )}

            <Table.Cell>
              <a href={editRegistrationUrl(registration.id)}>
                {I18n.t('registrations.list.edit')}
              </a>
            </Table.Cell>

            <Table.Cell>
              {wcaId ? (
                <a href={personUrl(wcaId)}>{wcaId}</a>
              ) : (
                <a href={editPersonUrl(userId)}>
                  <Icon name="edit" />
                  {I18n.t('users.edit.profile')}
                </a>
              )}
            </Table.Cell>

            <Table.Cell>{name}</Table.Cell>

            {dobIsShown && <Table.Cell>{dateOfBirth}</Table.Cell>}

            <Table.Cell>
              {country?.iso2 && (
                <>
                  <RegionFlag iso2={country.iso2} withoutTooltip={regionIsExpanded} />
                  {' '}
                  {regionIsExpanded && countries.byIso2?.[country.iso2]?.name}
                </>
              )}
            </Table.Cell>

            <Table.Cell>
              {usingPayment
                ? (
                  <PaidOn
                    withFullDate={dateIsExpanded}
                    updatedAt={updatedAt}
                    hasPaid={hasPaid}
                    registeredOn={registeredOn}
                    paymentStatus={paymentStatus}
                  />
                ) : (
                  <RegisteredOn withFullDate={dateIsExpanded} registeredOn={registeredOn} />
                )}
            </Table.Cell>

            {usingPayment && (
            <Table.Cell>
              {paymentAmount !== 0
                ? isoMoneyToHumanReadable(paymentAmount, competitionInfo.currency_code)
                : ''}
            </Table.Cell>
            )}

            {eventsAreExpanded ? (
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

            {commentsAreShown && (
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
                {emailIsExpanded ? (
                  emailAddress
                ) : (
                  <Popup
                    content={emailAddress}
                    trigger={<span><Icon name="mail" /></span>}
                  />
                )}
              </a>
              {' '}
              <Icon link onClick={copyEmail} name="copy" title={I18n.t('competitions.registration_v2.update.email_copy')} />
            </Table.Cell>
          </Table.Row>
        </Ref>
      )}
    </Draggable>
  );
}
