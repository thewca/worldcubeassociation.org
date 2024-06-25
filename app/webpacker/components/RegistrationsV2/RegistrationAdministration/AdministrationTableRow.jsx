import {
  Checkbox, Flag, Icon, Popup, Ref, Table,
} from 'semantic-ui-react';
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { setMessage } from '../Register/RegistrationMessage';
import i18n from '../../../lib/i18n';
import {
  getFullDateTimeString, getRegistrationTimestamp,
  getShortDateString,
  getShortTimeString,
} from '../../../lib/utils/dates';
import EventIcon from '../../wca/EventIcon';
import { editRegistrationUrl, editPersonUrl, personUrl } from '../../../lib/requests/routes.js.erb';

// Semantic Table only allows truncating _all_ columns in a table in
// single line fixed mode. As we only want to truncate the comment/admin notes
// this function is used to manually truncate the columns.
// TODO: We could fix this by building our own table component here
const truncateComment = (comment) => (comment?.length > 12 ? `${comment.slice(0, 12)}...` : comment);

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
  const { payment_status: paymentStatus, updated_at: updatedAt } = registration.payment;

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
              {draggable ? <Icon name="bars" /> : <Checkbox onChange={onCheckboxChange} checked={isSelected} />}
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
                  {region && country.name}
                </>
              ) : (
                <Popup
                  content={country.name}
                  trigger={(
                    <span>
                      <Flag name={country.iso2.toLowerCase()} />
                    </span>
            )}
                />
              )}
            </Table.Cell>

            <Table.Cell>
              { timestamp ? getRegistrationTimestamp(registeredOn) : (
                <Popup
                  content={getShortTimeString(registeredOn)}
                  trigger={<span>{getShortDateString(registeredOn)}</span>}
                />
              )}
            </Table.Cell>

            {competitionInfo['using_payment_integrations?'] && (
            <>
              <Table.Cell>{paymentStatus ?? i18n.t('registrations.list.not_paid')}</Table.Cell>
              <Table.Cell>
                {updatedAt && (
                  timestamp ? getRegistrationTimestamp(updatedAt)
                    : (
                      <Popup
                        content={getShortTimeString(updatedAt)}
                        trigger={<span>{getShortDateString(updatedAt)}</span>}
                      />
                    )
                )}
              </Table.Cell>
            </>
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
