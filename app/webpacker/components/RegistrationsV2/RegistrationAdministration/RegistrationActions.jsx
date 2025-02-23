import React from 'react';
import { Button, Dropdown } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';
import I18n from '../../../lib/i18n';
import { countries } from '../../../lib/wca-data.js.erb';
import {
  APPROVED_COLOR, APPROVED_ICON,
  CANCELLED_COLOR, CANCELLED_ICON,
  PENDING_COLOR, PENDING_ICON,
  REJECTED_COLOR, REJECTED_ICON,
  WAITLIST_COLOR, WAITLIST_ICON,
} from '../../../lib/utils/registrationAdmin';

function V3csvExport(selected, registrations, competition) {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent
    += `Status,Name,Country,WCA ID,Birth Date,Gender,${competition.event_ids.join(',')},Email,Guests,IP,Registration Date Time (UTC)\n`;
  registrations
    .filter((r) => selected.length === 0 || selected.includes(r.user_id))
    .forEach((registration) => {
      csvContent += `${registration.competing.registration_status === 'accepted' ? 'a' : 'p'},"${
        registration.user.name
      }","${countries.byIso2[registration.user.country.iso2].name}",${
        registration.user.wca_id
      },${registration.user.dob},${
        registration.user.gender
      },${competition.event_ids.map((evt) => (registration.competing.event_ids.includes(evt) ? '1' : '0'))},${
        registration.user.email
      },${
        registration.guests // IP feel always blank
      },"",${
        DateTime.fromISO(registration.competing.registered_on).setZone('UTC').toFormat('yyyy-MM-dd HH:mm:ss ZZZZ')
      }\n`;
    });
  const encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
}

function csvExport(selected, registrations, competition) {
  V3csvExport(selected, registrations.toSorted(
    (a, b) => DateTime.fromISO(a.competing.registered_on).toMillis()
      - DateTime.fromISO(b.competing.registered_on).toMillis(),
  ), competition);
}

export default function RegistrationActions({
  partitionedSelected,
  userEmailMap,
  refresh,
  registrations,
  spotsRemaining,
  competitionInfo,
  updateRegistrationMutation,
}) {
  const dispatch = useDispatch();
  const selectedCount = Object.values(partitionedSelected).reduce(
    (sum, part) => sum + part.length,
    0,
  );
  const anySelected = selectedCount > 0;

  const {
    pending, accepted, cancelled, waiting, rejected,
  } = partitionedSelected;
  const anyPending = pending.length < selectedCount;
  const anyApprovable = accepted.length < selectedCount;
  const anyCancellable = cancelled.length < selectedCount;
  const anyWaitlistable = waiting.length < selectedCount;
  const anyRejectable = rejected.length < selectedCount;

  const selectedEmails = [...pending, ...waiting, ...accepted, ...cancelled, ...rejected]
    .map((userId) => userEmailMap[userId])
    .join(',');

  const changeStatus = (attendees, status) => {
    updateRegistrationMutation(
      {
        requests: attendees.map((attendee) => (
          {
            user_id: attendee,
            competing: { status },
            competition_id: competitionInfo.id,
          })),
        competition_id: competitionInfo.id,
      },
      {
        onSuccess: () => {
          dispatch(setMessage('registrations.flash.updated', 'positive'));
          refresh();
        },
      },
    );
  };

  const moveToWaitingList = (attendees) => {
    const registrationsByUserId = _.groupBy(registrations, 'user_id');

    const [paid, unpaid] = _.partition(
      attendees,
      (userId) => registrationsByUserId[userId]?.[0]?.payment?.updated_at,
    );

    paid.sort((a, b) => {
      const dateA = new Date(registrationsByUserId[a][0].payment.updated_at);
      const dateB = new Date(registrationsByUserId[b][0].payment.updated_at);
      return dateA - dateB;
    });

    const combined = paid.concat(unpaid);
    changeStatus(combined, 'waiting_list');
  };

  const attemptToApprove = () => {
    const idsToAccept = [...pending, ...cancelled, ...waiting, ...rejected];
    if (idsToAccept.length > spotsRemaining) {
      dispatch(setMessage(
        'competitions.registration_v2.update.too_many',
        'negative',
        {
          count: idsToAccept.length - spotsRemaining,
        },
      ));
    } else {
      changeStatus(idsToAccept, 'accepted');
    }
  };

  const copyEmails = (emails) => {
    navigator.clipboard.writeText(emails);
    dispatch(setMessage('competitions.registration_v2.update.email_message', 'positive'));
  };

  return (
    <>
      <Button
        content={I18n.t('registrations.list.export_csv')}
        icon="download"
        labelPosition="left"
        color="blue"
        onClick={() => {
          csvExport(
            [...pending, ...accepted, ...cancelled, ...waiting, ...rejected],
            registrations,
            competitionInfo,
          );
        }}
      />

      <Button
        as="a"
        content={I18n.t('competitions.registration_v2.update.email_send')}
        href={`mailto:?bcc=${selectedEmails}`}
        id="email-selected"
        target="_blank"
        rel="noreferrer"
        icon="envelope"
        labelPosition="left"
        disabled={!anySelected}
      />

      <Button
        content={I18n.t('competitions.registration_v2.update.email_copy')}
        icon="copy"
        labelPosition="left"
        onClick={() => copyEmails(selectedEmails)}
        disabled={!anySelected}
      />

      <Dropdown
        pointing
        className="icon brown"
        labeled
        text={I18n.t('competitions.registration_v2.update.move_to')}
        icon="arrow right"
        button
        disabled={!anySelected}
      >
        <Dropdown.Menu>
          <MoveAction
            text={I18n.t('competitions.registration_v2.update.pending')}
            icon={PENDING_ICON}
            color={PENDING_COLOR}
            isDisabled={!anyPending}
            onClick={() => changeStatus(
              [...accepted, ...cancelled, ...waiting, ...rejected],
              'pending',
            )}
          />

          <MoveAction
            text={I18n.t('competitions.registration_v2.update.waitlist')}
            icon={WAITLIST_ICON}
            color={WAITLIST_COLOR}
            isDisabled={!anyWaitlistable}
            onClick={() => moveToWaitingList(
              [...pending, ...cancelled, ...accepted, ...rejected],
            )}
          />

          <MoveAction
            text={I18n.t('competitions.registration_v2.update.approved')}
            icon={APPROVED_ICON}
            color={APPROVED_COLOR}
            isDisabled={!anyApprovable}
            onClick={attemptToApprove}
          />

          <MoveAction
            text={I18n.t('competitions.registration_v2.update.cancelled')}
            icon={CANCELLED_ICON}
            color={CANCELLED_COLOR}
            isDisabled={!anyCancellable}
            onClick={() => changeStatus(
              [...pending, ...accepted, ...waiting, ...rejected],
              'cancelled',
            )}
          />

          <MoveAction
            text={I18n.t('competitions.registration_v2.update.rejected')}
            icon={REJECTED_ICON}
            color={REJECTED_COLOR}
            isDisabled={!anyRejectable}
            onClick={() => changeStatus(
              [...pending, ...accepted, ...waiting, ...cancelled],
              'rejected',
            )}
          />
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}

function MoveAction({
  text, icon, color, isDisabled, onClick,
}) {
  return (
    <Dropdown.Item
      content={text}
      icon={{ color, name: icon, size: 'large' }}
      disabled={isDisabled}
      onClick={onClick}
    />
  );
}
