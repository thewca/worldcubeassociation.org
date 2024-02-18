import { DateTime } from 'luxon';
import { events } from '../../lib/wca-data.js.erb';

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

// without time string, date will be interpreted in user's time zone
const parseDate = (dateString) => new Date(`${dateString}T00:00:00.000`);
const formatDate = (date) => DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');

export const getDisplayMode = (searchParams) => (
  searchParams.get(DISPLAY_MODE) || DEFAULT_DISPLAY_MODE
);

export const createFilterState = (searchParams) => ({
  timeOrder: searchParams.get(TIME_ORDER) || DEFAULT_TIME_ORDER,
  selectedYear: searchParams.get(YEAR) || DEFAULT_YEAR,
  customStartDate:
    searchParams.get(START_DATE) ? parseDate(searchParams.get(START_DATE)) : DEFAULT_DATE,
  customEndDate:
    searchParams.get(END_DATE) ? parseDate(searchParams.get(END_DATE)) : DEFAULT_DATE,
  region: searchParams.get(REGION) || DEFAULT_REGION,
  delegate: searchParams.get(DELEGATE) || DEFAULT_DELEGATE,
  search: searchParams.get(SEARCH) || DEFAULT_SEARCH,
  selectedEvents:
    searchParams.get(SELECTED_EVENTS)?.split(',')?.filter(Boolean) || DEFAULT_EVENTS,
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

  searchParams.set(DISPLAY_MODE, displayMode);
  searchParams.delete(DISPLAY_MODE, DEFAULT_DISPLAY_MODE);

  searchParams.set(TIME_ORDER, timeOrder);
  searchParams.delete(TIME_ORDER, DEFAULT_TIME_ORDER);
  searchParams.set(YEAR, selectedYear);
  searchParams.delete(YEAR, DEFAULT_YEAR);
  if (customStartDate) {
    searchParams.set(START_DATE, formatDate(customStartDate));
  } else {
    searchParams.delete(START_DATE);
  }
  if (customEndDate) {
    searchParams.set(END_DATE, formatDate(customEndDate));
  } else {
    searchParams.delete(END_DATE);
  }
  searchParams.set(REGION, region);
  searchParams.delete(REGION, DEFAULT_REGION);
  searchParams.set(DELEGATE, delegate);
  searchParams.delete(DELEGATE, DEFAULT_DELEGATE);
  searchParams.set(SEARCH, search);
  searchParams.delete(SEARCH, DEFAULT_SEARCH);
  searchParams.set(SELECTED_EVENTS, selectedEvents.join(','));
  searchParams.delete(SELECTED_EVENTS, DEFAULT_EVENTS.join(','));
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
