import {
  AddActivity, AddRoom, AddVenue,
  ChangesSaved, EditRoom, EditVenue,
  MoveActivity,
  RemoveActivity, RemoveRoom, RemoveVenue,
  ScaleActivity,
} from './actions';
import {
  changeTimezoneKeepingLocalTime,
  moveByIsoDuration,
  nextActivityId, nextRoomId, nextVenueId,
  rescaleDuration
} from '../../../lib/utils/edit-schedule';

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
    // Unfortunately, scaling child activities (properly) is rocket science.
    const nChildren = activity.childActivities.length;

    // Say you have a parent activity with n=3 children, and you scale the start by -1 hour (i.e. 1 hour earlier).
    //   In that case, the first child activity's start also has to be scaled by 1 hour.
    //   However, the second child activity's start only has to be scaled by 2/3 of 1 hour,
    //   and the last has to be scaled by only 1/3 of 1 hour. In general, the i-th child of n total children
    //   scales by (n-i)/n for the start of the activity.
    const startScaleUp = (nChildren - childIdx) / nChildren;

    // However, it doesn't end there. When a parent activity's _start_ scales, only the startTime
    //   has to be manipulated. But for the children, the _endTime_ ALSO has to be manipulated because
    //   even though only the start of the parent changes, the children _move_ within that scaled parent as a whole.
    //   The scaling factor for the end of a child is the same as the scaling factor for the start of the _next_ child.
    const endScaleUp = (nChildren - (childIdx + 1)) / nChildren;

    const childScaledUpStart = rescaleDuration(scaleStartIso, startScaleUp);
    const childScaledUpEnd = rescaleDuration(scaleStartIso, endScaleUp);

    // Of course, this all has to happen recursively because children can have children!
    const startScaledChild = scaleAcitvitiesByDuration(childActivity, childScaledUpStart, childScaledUpEnd);

    // And it gets even more crazy: The same (n-i)/n logic from above has to be applied to the endDate
    //   scaling of the parent as well, but of course IN REVERSE! So the _last_ child moves the full amount,
    //   the second-to-last child moves a little less, and the first child only moves a tiny bit.
    const startScaleDown = childIdx / nChildren;
    const endScaleDown = (childIdx + 1) / nChildren;

    const childScaledDownStart = rescaleDuration(scaleEndIso, startScaleDown);
    const childScaledDownEnd = rescaleDuration(scaleEndIso, endScaleDown);

    // Phew, we're done.
    return scaleAcitvitiesByDuration(startScaledChild, childScaledDownStart, childScaledDownEnd);
  }),
});

const changeActivityTimezone = (activity, oldTimezone, newTimezone) => ({
  ...activity,
  startTime: changeTimezoneKeepingLocalTime(activity.startTime, oldTimezone, newTimezone),
  endTime: changeTimezoneKeepingLocalTime(activity.endTime, oldTimezone, newTimezone),
  childActivities: activity.childActivities.map((childActivity) => changeActivityTimezone(childActivity, oldTimezone, newTimezone)),
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
            {
              ...payload.wcifActivity,
              id: nextActivityId(state.wcifSchedule),
            },
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

  [EditVenue]: (state, { payload }) => ({
    ...state,
    wcifSchedule: {
      ...state.wcifSchedule,
      venues: state.wcifSchedule.venues.map((venue) => (venue.id === payload.venueId ? {
        ...venue,
        [payload.propertyKey]: payload.newProperty,
        rooms: venue.rooms.map((room) => ({
          ...room,
          activities: (payload.propertyKey === 'timezone' ? room.activities.map((activity) => changeActivityTimezone(activity, venue.timezone, payload.newProperty)) : room.activities),
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
