import React from 'react';
import { Button, Dropdown, Icon } from 'semantic-ui-react';
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
        onClick={() => {
          csvExport(
            [...pending, ...accepted, ...cancelled, ...waiting, ...rejected],
            registrations,
            competitionInfo,
          );
        }}
        color="blue"
        icon="download"
        content={I18n.t('registrations.list.export_csv')}
      />

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
              {I18n.t('competitions.registration_v2.update.email_send')}
            </a>
          </Button>

          <Button
            onClick={() => copyEmails(selectedEmails)}
            icon="copy"
            content={I18n.t('competitions.registration_v2.update.email_copy')}
          />

          <Dropdown
            pointing
            className="icon"
            labeled
            text="Move to" // TODO: translate
            icon="arrow right"
            button
          >
            <Dropdown.Menu>
              <Dropdown.Item
                onClick={() => changeStatus(
                  [...accepted, ...cancelled, ...waiting, ...rejected],
                  'pending',
                )}
                content={I18n.t('competitions.registration_v2.update.move_pending')}
                icon={{ name: PENDING_ICON, color: PENDING_COLOR, size: 'large' }}
                disabled={!anyPending}
              />

              <Dropdown.Item
                onClick={() => moveToWaitingList(
                  [...pending, ...cancelled, ...accepted, ...rejected],
                )}
                content={I18n.t('competitions.registration_v2.update.move_waiting')}
                icon={{ name: WAITLIST_ICON, color: WAITLIST_COLOR, size: 'large' }}
                disabled={!anyWaitlistable}
              />

              <Dropdown.Item
                onClick={attemptToApprove}
                content={I18n.t('registrations.list.approve')}
                icon={{ color: APPROVED_COLOR, name: APPROVED_ICON, size: 'large' }}
                disabled={!anyApprovable}
              />

              <Dropdown.Item
                onClick={() => changeStatus(
                  [...pending, ...accepted, ...waiting, ...rejected],
                  'cancelled',
                )}
                content={I18n.t('competitions.registration_v2.update.cancel')}
                icon={{ name: CANCELLED_ICON, color: CANCELLED_COLOR, size: 'large' }}
                disabled={!anyCancellable}
              />

              <Dropdown.Item
                onClick={() => changeStatus(
                  [...pending, ...accepted, ...waiting, ...cancelled],
                  'rejected',
                )}
                content={I18n.t('competitions.registration_v2.update.reject')}
                icon={{ name: REJECTED_ICON, color: REJECTED_COLOR, size: 'large' }}
                disabled={!anyRejectable}
              />
            </Dropdown.Menu>
          </Dropdown>
        </>
      )}
    </>
  );
}
