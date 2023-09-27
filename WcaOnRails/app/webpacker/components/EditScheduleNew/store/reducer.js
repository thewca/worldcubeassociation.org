import {
  AddActivity,
  ChangesSaved,
  RemoveActivity,
} from './actions';

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
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
