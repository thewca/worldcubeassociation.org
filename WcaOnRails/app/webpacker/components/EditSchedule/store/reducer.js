import {
  AddActivity,
  AddRoom,
  AddVenue,
  ChangesSaved,
  CopyRoom,
  CopyVenue,
  EditActivity,
  EditRoom,
  EditVenue,
  MoveActivity,
  RemoveActivity,
  RemoveRoom,
  RemoveVenue,
  ScaleActivity,
} from './actions';
import {
  copyRoom, copyVenue, nextActivityId, nextRoomId, nextVenueId,
} from '../../../lib/utils/edit-schedule';
import {
  changeActivityTimezone, moveActivityByDuration, scaleActivitiesByDuration,
} from '../utils';

const reducers = {
  [ChangesSaved]: (state) => ({
    ...state,
    initialWcifSchedule: state.wcifSchedule,
  }),

  [AddActivity]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => ({
        ...venue,
        rooms: venue.rooms.map((room) => (room.id === payload.roomId ? ({
          ...room,
          activities: [
            ...room.activities,
            {
              ...payload.wcifActivity,
              id: nextActivityId(state.wcifSchedule),
            },
          ],
        }) : room)),
      })),
    },
  }),

  [EditActivity]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => ({
        ...venue,
        rooms: venue.rooms.map((room) => ({
          ...room,
          activities: room.activities.map((activity) => (
            activity.id === payload.activityId
              ? { ...activity, [payload.key]: payload.value }
              : activity
          )),
        })),
      })),
    },
  }),

  [RemoveActivity]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => ({
        ...venue,
        rooms: venue.rooms.map((room) => ({
          ...room,
          activities: room.activities.filter((activity) => activity.id !== payload.activityId),
        })),
      })),
    },
  }),

  [MoveActivity]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => ({
        ...venue,
        rooms: venue.rooms.map((room) => ({
          ...room,
          activities: room.activities.map((activity) => (
            activity.id === payload.activityId
              ? moveActivityByDuration(activity, payload.isoDuration)
              : activity
          )),
        })),
      })),
    },
  }),

  [ScaleActivity]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => ({
        ...venue,
        rooms: venue.rooms.map((room) => ({
          ...room,
          activities: room.activities.map((activity) => (
            activity.id === payload.activityId
              ? scaleActivitiesByDuration(activity, payload.isoDeltaStart, payload.isoDeltaEnd)
              : activity
          )),
        })),
      })),
    },
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
            activities: [],
            extensions: [],
          },
        ],
      } : venue)),
    },
  }),

  [CopyVenue]: (state, { payload }) => {
    const venue = state.wcifSchedule.venues.find(({id}) => id === payload.venueId)
    if (!venue) return state;

    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues: [
          ...state.wcifSchedule.venues,
          {
            ...copyVenue(state.wcifSchedule, venue),
            name: "Copy of " + venue.name,
          },
        ],
      },
    };
  },

  [CopyRoom]: (state, { payload }) => {
    const venue = state.wcifSchedule.venues.find(({id}) => id === payload.venueId)
    if (!venue) return state;
    const room = venue.rooms.find(({id}) => id === payload.roomId)
    if (!room) return state;

    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues: state.wcifSchedule.venues.map((venue) => (venue.id === payload.venueId ? {
          ...venue,
          rooms: [
            ...venue.rooms,
            {
              ...copyRoom(state.wcifSchedule, room),
              name: "Copy of " + room.name,
            },
          ],
        } : venue)),
      },
    };
},

  [ReorderVenue]: (state, { payload }) => {
    const { from, to } = payload;
    const venues = [...state.wcifSchedule.venues];

    if (from < 0 || from >= venues.length || to < 0 || to >= venues.length || to === from) {
      return state;
    }

    venues.splice(to, 0, venues.splice(from, 1)[0]);
    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues,
      },
    };
  },

  [ReorderRoom]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => {
        const { venueId, from, to } = payload;
        if (venue.id !== venueId) {
          return venue;
        }

        const rooms = [...venue.rooms];
        if (from < 0 || from >= rooms.length || to < 0 || to >= rooms.length || to === from) {
          return venue;
        }

        rooms.splice(to, 0, rooms.splice(from, 1)[0]);
        return {
          ...venue,
          rooms,
        };
      }),
    },
  }),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
