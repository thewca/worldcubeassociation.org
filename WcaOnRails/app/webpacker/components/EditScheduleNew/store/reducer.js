import {
  AddActivity,
  ChangesSaved,
  MoveActivity,
  RemoveActivity,
  ScaleActivity,
} from './actions';
import { moveByIsoDuration, rescaleDuration } from '../../../lib/utils/edit-schedule';

const moveActivityByDuration = (activity, isoDuration) => ({
  ...activity,
  startTime: moveByIsoDuration(activity.startTime, isoDuration),
  endTime: moveByIsoDuration(activity.endTime, isoDuration),
  childActivities: activity.childActivities.map((childActivity) => moveActivityByDuration(childActivity, isoDuration)),
});

const scaleAcitvitiesByDuration = (activity, scaleStartIso, scaleEndIso) => ({
  ...activity,
  startTime: moveByIsoDuration(activity.startTime, scaleStartIso),
  endTime: moveByIsoDuration(activity.endTime, scaleEndIso),
  childActivities: activity.childActivities.map((childActivity, childIdx) => {
    const nChildren = activity.childActivities.length;

    const startScalingFactor = (nChildren - childIdx) / nChildren;
    const endScalingFactor = (nChildren - childIdx + 1) / nChildren;

    const childScaleStartIso = rescaleDuration(scaleStartIso, startScalingFactor);
    const childScaleEndIso = rescaleDuration(scaleEndIso, endScalingFactor);

    return scaleAcitvitiesByDuration(childActivity, childScaleStartIso, childScaleEndIso);
  }),
});

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
            payload.wcifActivity,
          ],
        }) : room)),
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
          activities: room.activities.map((activity) => (activity.id === payload.activityId ? moveActivityByDuration(activity, payload.isoDuration) : activity)),
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
          activities: room.activities.map((activity) => (activity.id === payload.activityId ? scaleAcitvitiesByDuration(activity, payload.scaleStartIso, payload.scaleEndIso) : activity)),
        })),
      })),
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
