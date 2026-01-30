import React, { useMemo } from 'react';
import { Button, Dropdown } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { noop } from 'lodash';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { showMessage } from '../Register/RegistrationMessage';
import I18n from '../../../lib/i18n';
import { countries } from '../../../lib/wca-data.js.erb';
import {
  APPROVED_COLOR, APPROVED_ICON,
  CANCELLED_COLOR, CANCELLED_ICON,
  getSkippedPendingCount,
  getSkippedWaitlistCount,
  PENDING_COLOR, PENDING_ICON,
  REJECTED_COLOR, REJECTED_ICON,
  sortRegistrations,
  WAITLIST_COLOR, WAITLIST_ICON,
} from '../../../lib/utils/registrationAdmin';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';

function escapeCsv(value) {
  if (!value) return '';
  // Double any quotes (RFC 4180), then wrap the whole field in quotes
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function V3csvExport(selected, registrations, competition) {
  let csvContent = `Status,Name,Country,WCA ID,Birth Date,Gender,${competition.event_ids.join(',')},Email,Guests,IP,Registration Date Time (UTC),Payment Date Time(UTC),User Id,Registration Status,Registrant Id,Waiting List Position,Comments\n`;
  registrations
    .filter((r) => selected.length === 0 || selected.includes(r.user_id))
    .forEach((registration) => {
      csvContent += `${registration.competing.registration_status === 'accepted' ? 'a' : 'p'},"${
        registration.user.name
      }","${countries.byIso2[registration.user.country?.iso2]?.name}",${
        registration.user.wca_id
      },${registration.user.dob},${
        registration.user.gender
      },${competition.event_ids.map((evt) => (registration.competing.event_ids.includes(evt) ? '1' : '0'))},${
        registration.user.email
      },${
        registration.guests // IP feel always blank
      },"",${
        DateTime.fromISO(registration.competing.registered_on).setZone('UTC').toFormat('yyyy-MM-dd HH:mm:ss ZZZZ')
      },${
        registration.payment?.has_paid ? DateTime.fromISO(registration.payment.updated_at).setZone('UTC').toFormat('yyyy-MM-dd HH:mm:ss ZZZZ') : ''
      },${
        registration.user_id
      },${
        registration.competing.registration_status
      },${
        registration.registrant_id
      },${
        registration.competing.waiting_list_position || ''
      },${
        escapeCsv(registration.competing.comments)
      }\n`;
    });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${competition.id}-registration.csv`);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvExport(selected, registrations, competition) {
  V3csvExport(selected, registrations.toSorted(
    (a, b) => DateTime.fromISO(a.competing.registered_on).toMillis()
      - DateTime.fromISO(b.competing.registered_on).toMillis(),
  ), competition);
}

export default function RegistrationActions({
  partitionedSelectedIds,
  refresh,
  registrations,
  spotsRemaining,
  competitionInfo,
  updateRegistrationMutation,
}) {
  const confirm = useConfirm();
  const dispatch = useDispatch();
  const selectedCount = Object.values(partitionedSelectedIds).reduce(
    (sum, part) => sum + part.length,
    0,
  );
  const anySelected = selectedCount > 0;

  const {
    pending, accepted, cancelled, waiting, rejected, nonCompeting,
  } = partitionedSelectedIds;
  const anyPending = pending.length < selectedCount;
  const anyApprovable = accepted.length < selectedCount;
  const anyCancellable = cancelled.length < selectedCount;
  const anyWaitlistable = waiting.length < selectedCount;
  const anyRejectable = rejected.length < selectedCount;

  const userEmailMap = useMemo(
    () => Object.fromEntries(
      (registrations ?? []).map((registration) => [
        registration.user.id,
        registration.user.email,
      ]),
    ),
    [registrations],
  );

  const selectedEmails = [
    ...pending, ...waiting, ...accepted, ...cancelled, ...rejected, ...nonCompeting,
  ]
    .map((userId) => userEmailMap[userId])
    .join(',');

  const isUsingPaymentIntegration = competitionInfo['using_payment_integrations?'];
  const checkForSkippedPending = isUsingPaymentIntegration;

  const changeStatus = (attendees, status) => {
    updateRegistrationMutation(
      {
        competitionId: competitionInfo.id,
        payload: {
          requests: attendees.map((attendee) => (
            {
              user_id: attendee,
              competing: { status },
              competition_id: competitionInfo.id,
            })),
          competition_id: competitionInfo.id,
        },
      },
      {
        onSuccess: () => {
          dispatch(showMessage('registrations.flash.updated', 'positive'));
          refresh();
        },
      },
    );
  };

  const moveSelectedToWaitlist = () => {
    const idsToWaitlist = [...pending, ...cancelled, ...accepted, ...rejected];

    const registrationsToMove = registrations.filter(
      (reg) => idsToWaitlist.includes(reg.user_id),
    );
    const sortedRegistrationsToMove = sortRegistrations(
      registrationsToMove,
      'paid_on_with_registered_on_fallback',
      'ascending',
    );
    const sortedIdsToMove = sortedRegistrationsToMove.map((reg) => reg.user_id);
    changeStatus(sortedIdsToMove, 'waiting_list');
  };

  const showOverLimitMessage = (count) => dispatch(
    showMessage(
      'competitions.registration_v2.update.too_many',
      'negative',
      { count },
    ),
  );

  const onMoveSelectedToWaitlist = () => {
    const skippedPendingCount = getSkippedPendingCount(
      registrations,
      partitionedSelectedIds,
    );

    if (checkForSkippedPending && skippedPendingCount > 0) {
      confirm({
        content: I18n.t(
          'competitions.registration_v2.list.pending.waitlist_skipped_warning',
          { count: skippedPendingCount },
        ),
      }).then(
        moveSelectedToWaitlist,
      ).catch(noop);
    } else {
      moveSelectedToWaitlist();
    }
  };

  const onMoveSelectedToApproved = () => {
    const idsToAccept = [...pending, ...cancelled, ...waiting, ...rejected];
    const skippedWaitlistCount = getSkippedWaitlistCount(
      registrations,
      partitionedSelectedIds,
    );
    const amountOverLimit = Math.max(idsToAccept.length - spotsRemaining, 0);
    const goesOverLimit = amountOverLimit > 0;
    const skippedPendingCount = getSkippedPendingCount(
      registrations,
      partitionedSelectedIds,
    );

    if (goesOverLimit) {
      showOverLimitMessage(amountOverLimit);
    } else if (skippedWaitlistCount > 0 && (checkForSkippedPending && skippedPendingCount > 0)) {
      confirm({
        content: I18n.t(
          'competitions.registration_v2.list.approved.pending_waitlist_combined_skipped_warning',
          { count: skippedWaitlistCount + skippedPendingCount },
        ),
      }).then(
        () => changeStatus(idsToAccept, 'accepted'),
      ).catch(noop);
    } else if (skippedWaitlistCount > 0) {
      // note: if the user confirms (ignores the warning) then no further checks are done
      //  in this `else-if` chain; we can't check that directly in the `if` condition
      //  to make up for never seeing the last else below case, the first else case above exists
      confirm({
        content: I18n.t(
          'competitions.registration_v2.list.waitlist.skipped_warning',
          { count: skippedWaitlistCount },
        ),
      }).then(
        () => changeStatus(idsToAccept, 'accepted'),
      ).catch(noop);
    } else if (checkForSkippedPending && skippedPendingCount > 0) {
      confirm({
        content: I18n.t(
          'competitions.registration_v2.list.pending.approve_skipped_warning',
          { count: skippedPendingCount },
        ),
      }).then(
        () => changeStatus(idsToAccept, 'accepted'),
      ).catch(noop);
    } else {
      changeStatus(idsToAccept, 'accepted');
    }
  };

  const copyEmails = (emails) => {
    navigator.clipboard.writeText(emails);
    dispatch(showMessage('competitions.registration_v2.update.email_message', 'positive'));
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
        text={I18n.t('competitions.registration_v2.update.move_to', { count: selectedCount })}
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
            onClick={onMoveSelectedToWaitlist}
          />

          <MoveAction
            text={I18n.t('competitions.registration_v2.update.approved')}
            icon={APPROVED_ICON}
            color={APPROVED_COLOR}
            isDisabled={!anyApprovable}
            onClick={onMoveSelectedToApproved}
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
