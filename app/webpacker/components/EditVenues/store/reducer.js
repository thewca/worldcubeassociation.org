import {
  AddRoom,
  AddVenue,
  ChangesSaved,
  CopyRoom,
  CopyVenue,
  EditRoom,
  EditVenue,
  RemoveRoom,
  RemoveVenue,
} from './actions';
import {
  copyRoom, copyVenue, nextRoomId, nextVenueId,
} from '../../../lib/utils/edit-schedule';
import changeActivityTimezone from '../utils';
import { venueWcifFromRoomId } from '../../../lib/utils/wcif';
import { defaultRoomColor } from '../../../lib/wca-data.js.erb';

const reducers = {
  [ChangesSaved]: (state) => ({
    ...state,
    initialWcifSchedule: state.wcifSchedule,
  }),

  [EditVenue]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => (venue.id === payload.venueId ? {
        ...venue,
        [payload.propertyKey]: payload.newProperty,
        rooms: payload.propertyKey === 'timezone'
          ? venue.rooms.map((room) => ({
            ...room,
            activities: room.activities.map((activity) => (
              changeActivityTimezone(
                activity,
                venue.timezone,
                payload.newProperty,
              )
            )),
          }))
          : venue.rooms,
      } : venue)),
    },
  }),

  [EditRoom]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => ({
        ...venue,
        rooms: venue.rooms.map((room) => (room.id === payload.roomId ? {
          ...room,
          [payload.propertyKey]: payload.newProperty,
        } : room)),
      })),
    },
  }),

  [RemoveVenue]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.filter((venue) => venue.id !== payload.venueId),
    },
  }),

  [RemoveRoom]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => ({
        ...venue,
        rooms: venue.rooms.filter((room) => room.id !== payload.roomId),
      })),
    },
  }),

  [AddVenue]: (state) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: [
        ...state.wcifSchedule.venues,
        {
          id: nextVenueId(state.wcifSchedule),
          latitudeMicrodegrees: 0,
          longitudeMicrodegrees: 0,
          rooms: [],
          extensions: [],
        },
      ],
    },
  }),

  [AddRoom]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => (venue.id === payload.venueId ? {
        ...venue,
        rooms: [
          ...venue.rooms,
          {
            id: nextRoomId(state.wcifSchedule),
            color: defaultRoomColor,
            activities: [],
            extensions: [],
          },
        ],
      } : venue)),
    },
  }),

  [CopyVenue]: (state, { payload }) => {
    const venue = state.wcifSchedule.venues.find(({ id }) => id === payload.venueId);
    if (!venue) return state;

    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues: [
          ...state.wcifSchedule.venues,
          {
            ...copyVenue(state.wcifSchedule, venue),
            name: `Copy of ${venue.name}`,
          },
        ],
      },
    };
  },

  [CopyRoom]: (state, { payload }) => {
    const targetVenue = venueWcifFromRoomId(state.wcifSchedule, payload.roomId);
    if (!targetVenue) return state;
    const room = targetVenue.rooms.find(({ id }) => id === payload.roomId);
    if (!room) return state;

    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues: state.wcifSchedule.venues.map((venue) => (venue.id === targetVenue.id ? {
          ...venue,
          rooms: [
            ...venue.rooms,
            {
              ...copyRoom(state.wcifSchedule, room),
              name: `Copy of ${room.name}`,
            },
          ],
        } : venue)),
      },
    };
  },
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
