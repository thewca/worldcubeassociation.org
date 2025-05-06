import { DateTime } from 'luxon';
import { countries, WCA_EVENT_IDS } from '../wca-data.js.erb';

export const PENDING_COLOR = 'grey';
export const WAITLIST_COLOR = 'yellow';
export const APPROVED_COLOR = 'green';
export const CANCELLED_COLOR = 'orange';
export const REJECTED_COLOR = 'red';
export const NON_COMPETING_COLOR = 'purple';

export const PENDING_ICON = 'circle notched';
export const WAITLIST_ICON = 'hourglass';
export const APPROVED_ICON = 'check';
export const CANCELLED_ICON = 'trash';
export const REJECTED_ICON = 'x';
export const NON_COMPETING_ICON = 'clipboard outline';

export const getStatusColor = (key) => {
  switch (key) {
    case 'pending':
      return PENDING_COLOR;

    case 'waiting':
      return WAITLIST_COLOR;

    case 'accepted':
      return APPROVED_COLOR;

    case 'cancelled':
      return CANCELLED_COLOR;

    case 'rejected':
      return REJECTED_COLOR;

    case 'nonCompeting':
      return NON_COMPETING_COLOR;

    default:
      return undefined;
  }
};

export const getStatusIcon = (key) => {
  switch (key) {
    case 'pending':
      return PENDING_ICON;

    case 'waiting':
      return WAITLIST_ICON;

    case 'accepted':
      return APPROVED_ICON;

    case 'cancelled':
      return CANCELLED_ICON;

    case 'rejected':
      return REJECTED_ICON;

    case 'nonCompeting':
      return NON_COMPETING_ICON;

    default:
      return undefined;
  }
};

export const partitionRegistrations = (registrations) => registrations.reduce(
  (result, registration) => {
    switch (registration.competing.registration_status) {
      case 'pending':
        result.pending.push(registration);
        break;
      case 'waiting_list':
        result.waiting.push(registration);
        break;
      case 'accepted':
        result.accepted.push(registration);
        break;
      case 'cancelled':
        result.cancelled.push(registration);
        break;
      case 'rejected':
        result.rejected.push(registration);
        break;
      case 'non_competing':
        result.nonCompeting.push(registration);
        break;
      default:
        break;
    }
    return result;
  },
  {
    pending: [], waiting: [], accepted: [], cancelled: [], rejected: [], nonCompeting: [],
  },
);

export function sortRegistrations(registrations, sortColumn, sortDirection) {
  const sorted = registrations?.toSorted((a, b) => {
    switch (sortColumn) {
      case 'name':
        return a.user.name.localeCompare(b.user.name);

      case 'wca_id': {
        const aHasAccount = a.user.wca_id !== null;
        const bHasAccount = b.user.wca_id !== null;
        if (aHasAccount && !bHasAccount) {
          return 1;
        }
        if (!aHasAccount && bHasAccount) {
          return -1;
        }
        if (!aHasAccount && !bHasAccount) {
          return a.user.name.localeCompare(b.user.name);
        }
        return a.user.wca_id.localeCompare(b.user.wca_id);
      }

      case 'country':
        return countries.byIso2[a.user.country.iso2].name
          .localeCompare(countries.byIso2[b.user.country.iso2].name);

      case 'events':
        return a.competing.event_ids.length - b.competing.event_ids.length;

      case 'guests':
        return a.guests - b.guests;

      case 'dob':
        return DateTime.fromISO(a.user.dob).toMillis()
          - DateTime.fromISO(b.user.dob).toMillis();

      case 'comment':
        return a.competing.comment.localeCompare(b.competing.comment);

      case 'administrative_notes':
        return a.competing.admin_comment.localeCompare(b.competing.admin_comment);

      case 'registered_on':
        return DateTime.fromISO(a.competing.registered_on).toMillis()
          - DateTime.fromISO(b.competing.registered_on).toMillis();

      case 'paid_on_with_registered_on_fallback': {
        const hasAPaid = a.payment?.has_paid;
        const hasBPaid = b.payment?.has_paid;

        if (hasAPaid && hasBPaid) {
          return DateTime.fromISO(a.payment.updated_at).toMillis()
            - DateTime.fromISO(b.payment.updated_at).toMillis();
        }
        if (hasAPaid && !hasBPaid) {
          return -1;
        }
        if (!hasAPaid && hasBPaid) {
          return 1;
        }
        return DateTime.fromISO(a.competing.registered_on).toMillis()
          - DateTime.fromISO(b.competing.registered_on).toMillis();
      }

      case 'amount':
        return a.payment.payment_amount_iso - b.payment.payment_amount_iso;

      case 'waiting_list_position':
        return a.competing.waiting_list_position - b.competing.waiting_list_position;

      default: {
        if (WCA_EVENT_IDS.includes(sortColumn)) {
          const aHasEvent = a.competing.event_ids.includes(sortColumn);
          const bHasEvent = b.competing.event_ids.includes(sortColumn);

          return Number(bHasEvent) - Number(aHasEvent);
        }

        return 0;
      }
    }
  }) ?? [];

  if (sortDirection === 'descending') {
    return sorted.toReversed();
  }

  return sorted;
}

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
