import {
  AddActivity,
  ChangesSaved, MoveActivity,
  RemoveActivity,
} from './actions';
import { moveByIsoDuration } from '../../../lib/utils/edit-schedule';

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
          activities: room.activities.map((activity) => (activity.id === payload.activityId ? ({
            ...activity,
            startTime: moveByIsoDuration(activity.startTime, payload.isoDuration),
            endTime: moveByIsoDuration(activity.endTime, payload.isoDuration),
            childActivities: activity.childActivities.map((childActivity) => ({
              ...childActivity,
              startTime: moveByIsoDuration(childActivity.startTime, payload.isoDuration),
              endTime: moveByIsoDuration(childActivity.endTime, payload.isoDuration),
              // TODO recurse over child's child activities?
            })),
          }) : activity)),
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
