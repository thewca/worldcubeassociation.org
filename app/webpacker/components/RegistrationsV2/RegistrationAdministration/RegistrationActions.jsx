import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';
import i18n from '../../../lib/i18n';

function V3csvExport(selected, registrations, competition) {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent
    += `Status,Name,Country,WCA ID,Birth Date,Gender,${competition.event_ids.join(',')},Email,Guests,IP,Registration Date Time (UTC)\n`;
  registrations
    .filter((r) => selected.length === 0 || selected.includes(r.user_id))
    .forEach((registration) => {
      csvContent += `${registration.competing.registration_status === 'accepted' ? 'a' : 'p'},${
        registration.user.name
      },${registration.user.country.name},${
        registration.user.wca_id
      },${registration.dob},${
        registration.user.gender
      },${competition.event_ids.map((evt) => (registration.competing.event_ids.includes(evt) ? '1' : '0'))},${
        registration.email
      },${
        registration.guests // IP feel always blank
      },"",${
        DateTime.fromISO(registration.competing.registered_on).setZone('UTC').toFormat('yyyy-MM-dd HH:mm:ss ZZZZ')
      }\n`;
    });
  const encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
}

function V2csvExport(selected, registrations) {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent
    += 'user_id,guests,competing.event_ids,competing.registration_status,competing.registered_on,competing.comment,competing.admin_comment\n';
  registrations
    .filter((r) => selected.length === 0 || selected.includes(r.user_id))
    .forEach((registration) => {
      csvContent += `${registration.user_id},${
        registration.guests
      },${registration.competing.event_ids.join(';')},${
        registration.competing.registration_status
      },${registration.competing.registered_on},${
        registration.competing.comment
      },${registration.competing.admin_comment}\n`;
    });
  const encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
}

function csvExport(selected, registrations, competition) {
  if (competition.registration_version === 'v3') {
    V3csvExport(selected, registrations.toSorted(
      (a, b) => DateTime.fromISO(a.competing.registered_on).toMillis()
      - DateTime.fromISO(b.competing.registered_on).toMillis(),
    ), competition);
  } else {
    V2csvExport(selected, registrations);
  }
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

  const selectedEmails = [...pending, ...accepted, ...cancelled, ...waiting]
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
    <Button.Group className="stackable">
      <Button
        onClick={() => {
          csvExport(
            [...pending, ...accepted, ...cancelled, ...waiting, ...rejected],
            registrations,
            competitionInfo,
          );
        }}
      >
        <Icon name="download" />
        {' '}
        {i18n.t('registrations.list.export_csv')}
      </Button>

      {anySelected && (
        <>
          <Button>
            <a
              href={`mailto:?bcc=${selectedEmails}`}
              id="email-selected"
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="envelope" />
              {i18n.t('competitions.registration_v2.update.email_send')}
            </a>
          </Button>

          <Button onClick={() => copyEmails(selectedEmails)}>
            <Icon name="copy" />
            {i18n.t('competitions.registration_v2.update.email_copy')}
          </Button>
          <>
            {anyApprovable && (
              <Button positive onClick={attemptToApprove}>
                <Icon name="check" />
                {i18n.t('registrations.list.approve')}
              </Button>
            )}

            {anyPending && (
              <Button
                onClick={() => changeStatus(
                  [...accepted, ...cancelled, ...waiting, ...rejected],
                  'pending',
                )}
              >
                <Icon name="times" />
                {i18n.t('competitions.registration_v2.update.move_pending')}
              </Button>
            )}

            {anyWaitlistable && (
            <Button
              color="yellow"
              onClick={() => changeStatus(
                [...pending, ...cancelled, ...accepted, ...rejected],
                'waiting_list',
              )}
            >
              <Icon name="hourglass" />
              {i18n.t('competitions.registration_v2.update.move_waiting')}
            </Button>
            )}

            {anyCancellable && (
              <Button
                color="orange"
                onClick={() => changeStatus(
                  [...pending, ...accepted, ...waiting, ...rejected],
                  'cancelled',
                )}
              >
                <Icon name="trash" />
                {i18n.t('competitions.registration_v2.update.cancel')}
              </Button>
            )}

            {anyRejectable && (
              <Button
                negative
                onClick={() => changeStatus(
                  [...pending, ...accepted, ...waiting, ...cancelled],
                  'rejected',
                )}
              >
                <Icon name="delete" />
                {i18n.t('competitions.registration_v2.update.reject')}
              </Button>
            )}
          </>
          )
        </>
      )}
    </Button.Group>
  );
}
