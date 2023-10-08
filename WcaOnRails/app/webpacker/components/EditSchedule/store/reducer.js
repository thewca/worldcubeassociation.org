import {
  AddActivity,
  AddRoom,
  AddVenue,
  ChangesSaved,
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
  nextActivityId, nextRoomId, nextVenueId,
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
        rooms: venue.rooms.map((room) => ({
          ...room,
          activities: (
            payload.propertyKey === 'timezone'
              ? room.activities.map((activity) => (
                changeActivityTimezone(
                  activity,
                  venue.timezone,
                  payload.newProperty,
                )
              ))
              : room.activities
          ),
        })),
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
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
