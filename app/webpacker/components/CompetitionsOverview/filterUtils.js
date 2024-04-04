import {
  events, continents, countries,
} from '../../lib/wca-data.js.erb';
import { DateTime } from 'luxon';

// note: inconsistencies with previous search params
// - year value was 'all+years', is now 'all_years'
// - region value was the name, is now the 2-char code (for non-continents)
// - delegate value was user id, is now the WCA ID
// - selected events key was 'event_ids' and they were not a list

const DISPLAY_MODE = 'display';
const TIME_ORDER = 'state';
const YEAR = 'year';
const START_DATE = 'from_date';
const END_DATE = 'to_date';
const REGION = 'region';
const DELEGATE = 'delegate';
const SEARCH = 'search';
const SELECTED_EVENTS = 'events';
const INCLUDE_CANCELLED = 'show_cancelled';

const DEFAULT_DISPLAY_MODE = 'list';
const DEFAULT_TIME_ORDER = 'present';
const DEFAULT_YEAR = 'all_years';
const DEFAULT_DATE = null;
const DEFAULT_REGION = 'all';
const DEFAULT_DELEGATE = '';
const DEFAULT_SEARCH = '';
const DEFAULT_EVENTS = [];
const INCLUDE_CANCELLED_TRUE = 'on';

export const getDisplayMode = (searchParams) => (
  sanitizeMode(searchParams.get(DISPLAY_MODE))
);

export const createFilterState = (searchParams) => ({
  timeOrder: sanitizeTimeOrder(searchParams.get(TIME_ORDER)),
  selectedYear: sanitizeYear(searchParams.get(YEAR)),
  customStartDate: sanitizeDate(searchParams.get(START_DATE)),
  customEndDate: sanitizeDate(searchParams.get(END_DATE)),
  region: sanitizeRegion(searchParams.get(REGION)),
  delegate: searchParams.get(DELEGATE) || DEFAULT_DELEGATE,
  search: searchParams.get(SEARCH) || DEFAULT_SEARCH,
  selectedEvents:
    sanitizeEvents(searchParams.get(SELECTED_EVENTS)?.split(',')?.filter(Boolean)),
  shouldIncludeCancelled: searchParams.get(INCLUDE_CANCELLED) === INCLUDE_CANCELLED_TRUE,
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
  } = filterState;

  // update every string value; and then remove that value if it's redundant (ie is the default)
  searchParams.set(DISPLAY_MODE, displayMode);
  searchParams.delete(DISPLAY_MODE, DEFAULT_DISPLAY_MODE);

  searchParams.set(TIME_ORDER, timeOrder);
  searchParams.delete(TIME_ORDER, DEFAULT_TIME_ORDER);

  searchParams.set(YEAR, selectedYear);
  searchParams.delete(YEAR, DEFAULT_YEAR);

  searchParams.set(REGION, region);
  searchParams.delete(REGION, DEFAULT_REGION);

  searchParams.set(DELEGATE, delegate);
  searchParams.delete(DELEGATE, DEFAULT_DELEGATE);

  searchParams.set(SEARCH, search);
  searchParams.delete(SEARCH, DEFAULT_SEARCH);

  // similarly for array-of-string values
  searchParams.set(SELECTED_EVENTS, selectedEvents.join(','));
  searchParams.delete(SELECTED_EVENTS, DEFAULT_EVENTS.join(','));

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

  window.history.replaceState({}, '', `${window.location.pathname}?${searchParams}`);
};

const WCA_EVENT_IDS = Object.keys(events.byId);

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

// search param sanitizers

const displayModes = ['list', 'map'];
const sanitizeMode = (mode) => {
  if (displayModes.includes(mode)) {
    return mode;
  } else {
    return DEFAULT_DISPLAY_MODE;
  }
}

const timeOrders = ['present', 'recent', 'past', 'by_announcement', 'custom'];
const sanitizeTimeOrder = (order) => {
  if (timeOrders.includes(order)) {
    return order;
  } else {
    return DEFAULT_TIME_ORDER;
  }
};

const  sanitizeYear = (year) => {
  if (Number.isNaN(Number(year)) || Number(year) === 0) {
    return DEFAULT_YEAR;
  } else {
    return Number(year);
  }
};

const dateFormat = 'yyyy-MM-dd';
const sanitizeDate = (date) => {
  const luxonDate = DateTime.fromFormat(date || "", dateFormat);
  if (luxonDate.isValid) {
    return luxonDate.toFormat(dateFormat);
  } else {
    return DEFAULT_DATE;
  }
};

const sanitizeRegion = (region) => {
  if (region === "all") return region;
  const continent = continents.real.find(
    ({ id, name }) => region === id || region === name
  );
  const country = countries.real.find(({ id, iso2 }) => region === id || region === iso2);
  return continent?.id ?? country?.iso2 ?? DEFAULT_REGION;
};

// TODO: also check `event_ids` param for backward compatibility
const sanitizeEvents = (values) => {
  return (values || []).filter((value) => WCA_EVENT_IDS.includes(value));
};