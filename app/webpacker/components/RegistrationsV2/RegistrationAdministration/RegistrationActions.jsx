import React, { useMemo } from 'react';
import {
  Button, Dropdown, Popup, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { showMessage } from '../Register/RegistrationMessage';
import I18n from '../../../lib/i18n';
import { countries } from '../../../lib/wca-data.js.erb';
import {
  APPROVED_COLOR, APPROVED_ICON,
  CANCELLED_COLOR, CANCELLED_ICON,
  getSkippedWaitlistCount,
  PENDING_COLOR, PENDING_ICON,
  REJECTED_COLOR, REJECTED_ICON,
  WAITLIST_COLOR, WAITLIST_ICON,
} from '../../../lib/utils/registrationAdmin';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';

export const registrationStatusTranslationKeys = {
  pending: 'pending',
  waiting: 'waitlist',
  accepted: 'approved',
  cancelled: 'cancelled',
  rejected: 'rejected',
};

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
  partitionedRegistrations,
  refresh,
  registrations,
  spotsRemaining,
  competitionInfo,
  updateRegistrationMutation,
  tableRefs,
}) {
  const confirm = useConfirm();
  const dispatch = useDispatch();
  const selectedCount = Object.values(partitionedSelectedIds).reduce(
    (sum, part) => sum + part.length,
    0,
  );
  const anySelected = selectedCount > 0;

  const {
    pending, accepted, cancelled, waiting, rejected,
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
          dispatch(showMessage('registrations.flash.updated', 'positive'));
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
    const skippedWaitlistCount = getSkippedWaitlistCount(
      registrations,
      partitionedSelectedIds,
    );

    if (skippedWaitlistCount > 0) {
      confirm({
        content: I18n.t(
          'competitions.registration_v2.list.waitlist.skipped_warning',
          { count: skippedWaitlistCount },
        ),
      }).then(
        () => changeStatus(idsToAccept, 'accepted'),
      ).catch(() => null);
    } else if (idsToAccept.length > spotsRemaining) {
      dispatch(showMessage(
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
    dispatch(showMessage('competitions.registration_v2.update.email_message', 'positive'));
  };

  const scrollToRef = (ref) => ref.current.scrollIntoView(
    { behavior: 'smooth', block: 'start' },
  );

  const hasCompetitorLimit = Boolean(competitionInfo.competitor_limit);

  return (
    <>
      <Popup
        flowing
        trigger={
          <Button color="black" icon="info" text={I18n.t('competitions.registration_v2.info')} />
        }
        content={(
          <SummaryTable
            partitionedSelectedIds={partitionedSelectedIds}
            partitionedRegistrations={partitionedRegistrations}
            partitionedMaximums={{ accepted: competitionInfo.competitor_limit }}
            selectedCount={selectedCount}
            registrationCount={registrations.length}
            withSelectedCounts={anySelected}
            withMaximums={hasCompetitorLimit}
          />
        )}
      />

      <Dropdown
        pointing
        className="icon white"
        labeled
        text={I18n.t('competitions.registration_v2.update.scroll_to')}
        icon="th list"
        button
      >
        <Dropdown.Menu>
          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.pending')}
            icon={PENDING_ICON}
            color={PENDING_COLOR}
            onClick={() => scrollToRef(tableRefs.pendingRef)}
          />

          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.waitlist')}
            icon={WAITLIST_ICON}
            color={WAITLIST_COLOR}
            onClick={() => scrollToRef(tableRefs.waitlistRef)}
          />

          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.approved')}
            icon={APPROVED_ICON}
            color={APPROVED_COLOR}
            onClick={() => scrollToRef(tableRefs.approvedRef)}
          />

          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.cancelled')}
            icon={CANCELLED_ICON}
            color={CANCELLED_COLOR}
            onClick={() => scrollToRef(tableRefs.cancelledRef)}
          />

          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.rejected')}
            icon={REJECTED_ICON}
            color={REJECTED_COLOR}
            onClick={() => scrollToRef(tableRefs.rejectedRef)}
          />
        </Dropdown.Menu>
      </Dropdown>

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

      <Dropdown
        pointing
        className="icon grey"
        labeled
        text={I18n.t('competitions.registration_v2.update.email', { count: selectedCount })}
        icon="envelope"
        button
        disabled={!anySelected}
      >
        <Dropdown.Menu>
          <DropdownLink
            text={I18n.t('competitions.registration_v2.update.email_send')}
            icon="pencil"
            href={`mailto:?bcc=${selectedEmails}`}
          />

          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.email_copy')}
            icon="copy"
            onClick={() => copyEmails(selectedEmails)}
          />
        </Dropdown.Menu>
      </Dropdown>

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
          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.pending')}
            icon={PENDING_ICON}
            color={PENDING_COLOR}
            isDisabled={!anyPending}
            onClick={() => changeStatus(
              [...accepted, ...cancelled, ...waiting, ...rejected],
              'pending',
            )}
          />

          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.waitlist')}
            icon={WAITLIST_ICON}
            color={WAITLIST_COLOR}
            isDisabled={!anyWaitlistable}
            onClick={() => moveToWaitingList(
              [...pending, ...cancelled, ...accepted, ...rejected],
            )}
          />

          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.approved')}
            icon={APPROVED_ICON}
            color={APPROVED_COLOR}
            isDisabled={!anyApprovable}
            onClick={attemptToApprove}
          />

          <DropdownAction
            text={I18n.t('competitions.registration_v2.update.cancelled')}
            icon={CANCELLED_ICON}
            color={CANCELLED_COLOR}
            isDisabled={!anyCancellable}
            onClick={() => changeStatus(
              [...pending, ...accepted, ...waiting, ...rejected],
              'cancelled',
            )}
          />

          <DropdownAction
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

function SummaryTable({
  partitionedSelectedIds,
  partitionedRegistrations,
  partitionedMaximums,
  selectedCount,
  registrationCount,
  withSelectedCounts,
  withMaximums,
}) {
  return (
    <Table basic="very">
      <TableHeader>
        <TableRow>
          <TableHeaderCell />
          {withSelectedCounts && <TableHeaderCell textAlign="right">Selected</TableHeaderCell>}
          <TableHeaderCell textAlign="right">Size</TableHeaderCell>
          {withMaximums && <TableHeaderCell textAlign="right">Max</TableHeaderCell>}
        </TableRow>
      </TableHeader>

      <TableBody>
        {Object.entries(registrationStatusTranslationKeys).map(([status, translationKey]) => (
          <TableRow key={status}>
            <TableCell>{I18n.t(`competitions.registration_v2.update.${translationKey}`)}</TableCell>
            {withSelectedCounts && <TableCell textAlign="right">{partitionedSelectedIds[status].length}</TableCell>}
            <TableCell textAlign="right">{partitionedRegistrations[status].length}</TableCell>
            {withMaximums && <TableCell textAlign="right">{partitionedMaximums[status] ?? '-'}</TableCell>}
          </TableRow>
        ))}
      </TableBody>

      <Table.Footer>
        <TableRow>
          <TableCell>Total</TableCell>
          {withSelectedCounts && <TableCell textAlign="right">{selectedCount}</TableCell>}
          <TableCell textAlign="right">{registrationCount}</TableCell>
          {withMaximums && <TableCell textAlign="right">-</TableCell>}
        </TableRow>
      </Table.Footer>
    </Table>
  );
}

function DropdownAction({
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

function DropdownLink({
  text, icon, color, isDisabled, href,
}) {
  return (
    <Dropdown.Item
      content={text}
      icon={{ color, name: icon, size: 'large' }}
      disabled={isDisabled}
      as="a"
      href={href}
      // id="email-selected"
      target="_blank"
      rel="noreferrer"
    />
  );
}
