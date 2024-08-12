import { DateTime } from 'luxon';
import {
  continents, countries, nonFutureCompetitionYears,
} from '../../lib/wca-data.js.erb';
import { WCA_EVENT_IDS } from './CompetitionsFilters';

// note: inconsistencies with previous search params
// - year value was 'all+years', is now 'all_years'
// --> handled by the fact that every non-number is interpreted as "default value" all_years
//     which means that 'all+years' lands in this "catchall" despite not being explicitly converted
// - region value was the name, is now the 2-char code (for non-continents)
// --> handled in sanitizer below that checks for ID or ISO or name for backwards compatibility

const DISPLAY_MODE = 'display';
const TIME_ORDER = 'state';
const YEAR = 'year';
const START_DATE = 'from_date';
const END_DATE = 'to_date';
const REGION = 'region';
const DELEGATE = 'delegate';
const SEARCH = 'search';
const SELECTED_EVENTS = 'event_ids[]';
const INCLUDE_CANCELLED = 'show_cancelled';
const SHOW_ADMIN_DETAILS = 'show_admin_details';
const ADMIN_STATUS = 'admin_status';
const LEGACY_ADMIN_STATUS = 'status';

const DEFAULT_DISPLAY_MODE = 'list';
const DEFAULT_TIME_ORDER = 'present';
const DEFAULT_YEAR = 'all_years';
const DEFAULT_DATE = null;
const DEFAULT_REGION_ALL = 'all';
const DEFAULT_REGION = '';
const DEFAULT_DELEGATE = '';
const DEFAULT_SEARCH = '';
const DEFAULT_ADMIN_STATUS = 'all';
const INCLUDE_CANCELLED_TRUE = 'on';
const SHOW_ADMIN_DETAILS_TRUE = 'yes';
const LEGACY_DISPLAY_MODE_ADMIN = 'admin';

// search param sanitizers

const displayModes = ['list', 'map'];
const sanitizeMode = (mode) => {
  if (displayModes.includes(mode)) {
    return mode;
  }
  return DEFAULT_DISPLAY_MODE;
};

const timeOrders = ['present', 'recent', 'past', 'by_announcement', 'custom'];
const sanitizeTimeOrder = (order) => {
  if (timeOrders.includes(order)) {
    return order;
  }
  return DEFAULT_TIME_ORDER;
};

const adminStatusFlags = ['all', 'warning', 'danger'];
const sanitizeAdminStatus = (status) => {
  if (adminStatusFlags.includes(status)) {
    return status;
  }
  return DEFAULT_ADMIN_STATUS;
};

const sanitizeYear = (year) => {
  if (nonFutureCompetitionYears.includes(Number(year))) {
    return Number(year);
  }
  return DEFAULT_YEAR;
};

const dateFormat = 'yyyy-MM-dd';
const sanitizeDate = (date) => {
  const luxonDate = DateTime.fromFormat(date || '', dateFormat);
  if (luxonDate.isValid) {
    return luxonDate.toFormat(dateFormat);
  }
  return DEFAULT_DATE;
};

const sanitizeRegion = (region) => {
  if (region === 'all') return region;
  const continent = continents.real.find(
    ({ id, name }) => region === id || region === name,
  );
  const country = countries.real.find(({ id, iso2 }) => region === id || region === iso2);
  return continent?.id ?? country?.iso2 ?? DEFAULT_REGION_ALL;
};

const sanitizeEvents = (values) => (values || []).filter(
  (value) => WCA_EVENT_IDS.includes(value),
);

// filter state

export const getDisplayMode = (searchParams) => (
  sanitizeMode(searchParams.get(DISPLAY_MODE))
);

export const createFilterState = (searchParams) => ({
  timeOrder: sanitizeTimeOrder(searchParams.get(TIME_ORDER)),
  selectedYear: sanitizeYear(searchParams.get(YEAR)),
  customStartDate: sanitizeDate(searchParams.get(START_DATE)),
  customEndDate: sanitizeDate(searchParams.get(END_DATE)),
  region: sanitizeRegion(searchParams.get(REGION)),
  delegate: Number(searchParams.get(DELEGATE)) || DEFAULT_DELEGATE,
  search: searchParams.get(SEARCH) || DEFAULT_SEARCH,
  selectedEvents:
    sanitizeEvents(searchParams.getAll(SELECTED_EVENTS)),
  shouldIncludeCancelled: searchParams.get(INCLUDE_CANCELLED) === INCLUDE_CANCELLED_TRUE,
  shouldShowAdminDetails: searchParams.get(SHOW_ADMIN_DETAILS) === SHOW_ADMIN_DETAILS_TRUE
    || searchParams.get(DISPLAY_MODE) === LEGACY_DISPLAY_MODE_ADMIN,
  adminStatus: sanitizeAdminStatus(
    searchParams.get(ADMIN_STATUS)
    || searchParams.get(LEGACY_ADMIN_STATUS),
  ),
});

export const updateSearchParams = (searchParams, filterState, displayMode) => {
  const {
    timeOrder,
    selectedYear,
    customStartDate,
    customEndDate,
    region,
    delegate,
    search,
    selectedEvents,
    shouldIncludeCancelled,
    shouldShowAdminDetails,
    adminStatus,
  } = filterState;

  // update every string value; and then remove that value if it's redundant (ie is the default)
  searchParams.set(DISPLAY_MODE, displayMode);
  searchParams.delete(DISPLAY_MODE, DEFAULT_DISPLAY_MODE);
  // also delete deprecated parameters (we set admin_details in a separate flag below)
  searchParams.delete(DISPLAY_MODE, LEGACY_DISPLAY_MODE_ADMIN);

  searchParams.set(TIME_ORDER, timeOrder);
  searchParams.delete(TIME_ORDER, DEFAULT_TIME_ORDER);

  searchParams.set(ADMIN_STATUS, adminStatus);
  searchParams.delete(ADMIN_STATUS, DEFAULT_ADMIN_STATUS);
  searchParams.delete(LEGACY_ADMIN_STATUS);

  searchParams.set(YEAR, selectedYear);
  searchParams.delete(YEAR, DEFAULT_YEAR);

  searchParams.set(REGION, region);
  searchParams.delete(REGION, DEFAULT_REGION_ALL);
  searchParams.delete(REGION, DEFAULT_REGION);

  searchParams.set(DELEGATE, delegate);
  searchParams.delete(DELEGATE, DEFAULT_DELEGATE);

  searchParams.set(SEARCH, search);
  searchParams.delete(SEARCH, DEFAULT_SEARCH);

  // first, delete previously selected events, then add new events.
  // If no custom events are selected, this code does not change the URL, which is what we want.
  searchParams.delete(SELECTED_EVENTS);
  selectedEvents.forEach((selectedEvent) => searchParams.append(SELECTED_EVENTS, selectedEvent));

  // for date values, add them if applicable, otherwise omit them
  if (customStartDate) {
    searchParams.set(START_DATE, customStartDate);
  } else {
    searchParams.delete(START_DATE);
  }

  if (customEndDate) {
    searchParams.set(END_DATE, customEndDate);
  } else {
    searchParams.delete(END_DATE);
  }

  // boolean values are only present when true, otherwise omit them
  if (shouldIncludeCancelled) {
    searchParams.set(INCLUDE_CANCELLED, INCLUDE_CANCELLED_TRUE);
  } else {
    searchParams.delete(INCLUDE_CANCELLED);
  }

  if (shouldShowAdminDetails) {
    searchParams.set(SHOW_ADMIN_DETAILS, SHOW_ADMIN_DETAILS_TRUE);
  } else {
    searchParams.delete(SHOW_ADMIN_DETAILS);
  }

  window.history.replaceState({}, '', `${window.location.pathname}?${searchParams}`);
};

export const filterReducer = (state, action) => {
  switch (action.type) {
    case 'reset':
      return createFilterState(new URLSearchParams());
    case 'toggle_event':
      return {
        ...state,
        selectedEvents: state.selectedEvents.includes(action.eventId)
          ? state.selectedEvents.filter((id) => id !== action.eventId)
          : [...state.selectedEvents, action.eventId],
      };
    case 'select_all_events':
      return { ...state, selectedEvents: WCA_EVENT_IDS };
    case 'clear_events':
      return { ...state, selectedEvents: [] };
    default:
      return { ...state, ...action };
  }
};
