import { useMutation } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { bulkUpdateRegistrations } from '../api/registration/patch/update_registration';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';
import i18n from '../../../lib/i18n';

function csvExport(selected, registrations) {
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
    pending, accepted, cancelled, waiting,
  } = partitionedSelected;
  const anyRejectable = pending.length < selectedCount;
  const anyApprovable = accepted.length < selectedCount;
  const anyCancellable = cancelled.length < selectedCount;
  const anyWaitlistable = waiting.length < selectedCount;

  const selectedEmails = [...pending, ...accepted, ...cancelled, ...waiting]
    .map((userId) => userEmailMap[userId])
    .join(',');

  const changeStatus = (attendees, status) => {
    updateRegistrationMutation(
      {
        requests: attendees.map((attendee) => ({ user_id: attendee, competing: { status } })),
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
    const idsToAccept = [...pending, ...cancelled, ...waiting];
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
    <Button.Group>
      <Button
        onClick={() => {
          csvExport(
            [...pending, ...accepted, ...cancelled, ...waiting],
            registrations,
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
              className="btn btn-info selected-registrations-actions"
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

            {anyRejectable && (
              <Button
                onClick={() => changeStatus(
                  [...accepted, ...cancelled, ...waiting],
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
                  [...pending, ...cancelled, ...accepted],
                  'waiting_list',
                )}
              >
                <Icon name="hourglass" />
                {i18n.t('competitions.registration_v2.update.move_waiting')}
              </Button>
            )}

            {anyCancellable && (
              <Button
                negative
                onClick={() => changeStatus(
                  [...pending, ...accepted, ...waiting],
                  'cancelled',
                )}
              >
                <Icon name="trash" />
                {i18n.t('competitions.registration_v2.update.cancel')}
              </Button>
            )}
          </>
          )
        </>
      )}
    </Button.Group>
  );
}
