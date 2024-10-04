import {
  AddActivity,
  ChangesSaved,
  CopyRoomActivities,
  EditActivity,
  MoveActivity,
  RemoveActivity,
  ScaleActivity,
} from './actions';
import {
  copyActivity, nextActivityId,
} from '../../../lib/utils/edit-schedule';
import {
  moveActivityByDuration, scaleActivitiesByDuration,
} from '../utils';
import {
  activityWcifFromId,
  doActivitiesMatch,
  roomWcifFromId,
  venueWcifFromRoomId,
} from '../../../lib/utils/wcif';

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

  [EditActivity]: (state, { payload }) => {
    const selectedActivity = activityWcifFromId(state.wcifSchedule, payload.activityId);

    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues: state.wcifSchedule.venues.map((venue) => ({
          ...venue,
          rooms: venue.rooms.map((room) => ({
            ...room,
            activities: room.activities.map((activity) => (
              (activity.id === selectedActivity.id || (
                payload.updateMatches && doActivitiesMatch(activity, selectedActivity)
              ))
                ? { ...activity, [payload.key]: payload.value }
                : activity
            )),
          })),
        })),
      },
    };
  },

  [RemoveActivity]: (state, { payload }) => {
    const selectedActivity = activityWcifFromId(state.wcifSchedule, payload.activityId);

    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues: state.wcifSchedule.venues.map((venue) => ({
          ...venue,
          rooms: venue.rooms.map((room) => ({
            ...room,
            activities: room.activities.filter((activity) => (
              activity.id !== payload.activityId && (
                !payload.updateMatches || !doActivitiesMatch(activity, selectedActivity)
              )
            )),
          })),
        })),
      },
    };
  },

  [MoveActivity]: (state, { payload }) => {
    const selectedActivity = activityWcifFromId(state.wcifSchedule, payload.activityId);

    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues: state.wcifSchedule.venues.map((venue) => ({
          ...venue,
          rooms: venue.rooms.map((room) => ({
            ...room,
            activities: room.activities.map((activity) => (
              (activity.id === selectedActivity.id || (
                payload.updateMatches && doActivitiesMatch(activity, selectedActivity)
              ))
                ? moveActivityByDuration(activity, payload.isoDuration)
                : activity
            )),
          })),
        })),
      },
    };
  },

  [ScaleActivity]: (state, { payload }) => {
    const selectedActivity = activityWcifFromId(state.wcifSchedule, payload.activityId);

    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues: state.wcifSchedule.venues.map((venue) => ({
          ...venue,
          rooms: venue.rooms.map((room) => ({
            ...room,
            activities: room.activities.map((activity) => (
              (activity.id === selectedActivity.id || (
                payload.updateMatches && doActivitiesMatch(activity, selectedActivity)
              ))
                ? scaleActivitiesByDuration(activity, payload.isoDeltaStart, payload.isoDeltaEnd)
                : activity
            )),
          })),
        })),
      },
    };
  },

  [CopyRoomActivities]: (state, { payload }) => {
    const { sourceRoomId, targetRoomId } = payload;
    const sourceRoomActivities = roomWcifFromId(state.wcifSchedule, sourceRoomId).activities;
    if (sourceRoomActivities.length === 0) return state;
    const copiedActivities = sourceRoomActivities.map(
      (activity) => copyActivity(state.wcifSchedule, activity),
    );
    const targetRoomVenueId = venueWcifFromRoomId(state.wcifSchedule, targetRoomId).id;

    return {
      ...state,
      wcifSchedule: {
        ...state.wcifSchedule,
        venues: state.wcifSchedule.venues.map((venue) => (venue.id === targetRoomVenueId ? {
          ...venue,
          rooms: venue.rooms.map((room) => (room.id === targetRoomId ? {
            ...room,
            activities: [...room.activities, ...copiedActivities],
          } : room)),
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
