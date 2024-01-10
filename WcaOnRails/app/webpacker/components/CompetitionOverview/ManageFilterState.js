import { events } from '../../lib/wca-data.js.erb';

const WCA_EVENT_IDS = Object.values(events.official).map((e) => e.id);

export const filterInitialState = {
  timeOrder: 'present',
  selectedYear: 'all_years',
  customStartDate: null,
  customEndDate: null,
  region: 'all_regions',
  delegate: '',
  search: '',
  selectedEvents: [],
  shouldShowRegStatus: false,
  shouldIncludeCancelled: false,
  displayMode: 'list',
};

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
