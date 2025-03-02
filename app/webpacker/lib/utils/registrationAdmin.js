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

function getFirstUnselectedOnWaitlist(
  registrations,
  selectedWaitlistIds,
) {
  const waitlistRegistrations = getSortedWaitlistRegistrations(registrations);

  return waitlistRegistrations.find(
    (reg) => !selectedWaitlistIds.includes(reg.user_id),
  );
}

function getLastSelectedOnWaitlist(
  registrations,
  selectedWaitlistIds,
) {
  const waitlistRegistrations = getSortedWaitlistRegistrations(registrations);

  return waitlistRegistrations.findLast(
    (reg) => selectedWaitlistIds.includes(reg.user_id),
  );
}

export function getSkippedWaitlistRegistration(
  registrations,
  partitionedSelectedIds,
) {
  const {
    pending, waiting, cancelled, rejected,
  } = partitionedSelectedIds;

  const waitlistRegistrations = getSortedWaitlistRegistrations(registrations);
  if (waitlistRegistrations.length === 0) return null;

  const firstUnselectedOnWaitlist = getFirstUnselectedOnWaitlist(
    registrations,
    waiting,
  );
  if (!firstUnselectedOnWaitlist) return null;

  const notAllWaitlistIsSelected = waiting.length < waitlistRegistrations.length;
  const aNonAcceptedNonWaitlistIsSelected = pending.length > 0
    || cancelled.length > 0
    || rejected.length > 0;
  if (notAllWaitlistIsSelected && aNonAcceptedNonWaitlistIsSelected) {
    return firstUnselectedOnWaitlist;
  }

  const lastSelectedOnWaitlist = getLastSelectedOnWaitlist(
    registrations,
    waiting,
  );
  // at this point the waitlist is non-empty and fully selected, so this exists
  if (!lastSelectedOnWaitlist) {
    console.error('lastSelectedOnWaitlist should exist');
    return undefined;
  }

  const firstUnselectedPosition = firstUnselectedOnWaitlist.competing.waiting_list_position;
  const lastSelectedPosition = lastSelectedOnWaitlist.competing.waiting_list_position;
  if (firstUnselectedPosition < lastSelectedPosition) {
    return firstUnselectedOnWaitlist;
  }

  return null;
}
