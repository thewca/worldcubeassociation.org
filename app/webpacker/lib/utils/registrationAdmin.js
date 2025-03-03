export const PENDING_COLOR = 'grey';
export const WAITLIST_COLOR = 'yellow';
export const APPROVED_COLOR = 'green';
export const CANCELLED_COLOR = 'orange';
export const REJECTED_COLOR = 'red';

export const PENDING_ICON = 'circle notched';
export const WAITLIST_ICON = 'hourglass';
export const APPROVED_ICON = 'check';
export const CANCELLED_ICON = 'trash';
export const REJECTED_ICON = 'x';

function getSortedWaitlistRegistrations(registrations) {
  return registrations.filter(
    (reg) => reg.competing.registration_status === 'waiting_list',
  ).toSorted(
    (a, b) => a.competing.waiting_list_position - b.competing.waiting_list_position,
  );
}

function getLastSelectedOnWaitlist(
  waitlistRegistrations,
  selectedWaitlistIds,
) {
  return waitlistRegistrations.findLast(
    (reg) => selectedWaitlistIds.includes(reg.user_id),
  );
}

export function getSkippedWaitlistCount(
  registrations,
  partitionedSelectedIds,
) {
  const {
    pending, waiting, cancelled, rejected,
  } = partitionedSelectedIds;
  const aNonAcceptedNonWaitlistIsSelected = pending.length > 0
    || cancelled.length > 0
    || rejected.length > 0;

  const waitlistRegistrations = getSortedWaitlistRegistrations(registrations);
  const lastSelectedOnWaitlist = getLastSelectedOnWaitlist(
    waitlistRegistrations,
    waiting,
  );

  const shouldBeSelectedRegistrations = aNonAcceptedNonWaitlistIsSelected
    ? waitlistRegistrations
    : waitlistRegistrations.slice(
      0,
      lastSelectedOnWaitlist?.competing?.waiting_list_position ?? 0,
    );

  return shouldBeSelectedRegistrations.filter(
    (reg) => !waiting.includes(reg.user_id),
  ).length;
}
