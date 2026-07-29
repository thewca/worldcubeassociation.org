import {
  addIsoDurations,
  changeTimezoneKeepingLocalTime,
  millisecondsBetween,
  moveByIsoDuration,
  rescaleIsoDuration,
} from '../../lib/utils/edit-schedule';

export const moveActivityByDuration = (activity, isoDuration) => ({
  ...activity,
  startTime: moveByIsoDuration(activity.startTime, isoDuration),
  endTime: moveByIsoDuration(activity.endTime, isoDuration),
  childActivities: activity.childActivities.map((childActivity) => (
    moveActivityByDuration(childActivity, isoDuration)
  )),
});

export const scaleActivitiesByDuration = (activity, isoDeltaStart, isoDeltaEnd) => {
  const rootActivityLengthMs = millisecondsBetween(
    activity.startTime,
    activity.endTime,
  );

  return ({
    ...activity,
    startTime: moveByIsoDuration(activity.startTime, isoDeltaStart),
    endTime: moveByIsoDuration(activity.endTime, isoDeltaEnd),
    childActivities: activity.childActivities.map((childActivity) => {
      // Unfortunately, scaling child activities (properly) is rocket science.
      const childActivityLengthMs = millisecondsBetween(
        childActivity.startTime,
        childActivity.endTime,
      );

      // Say you scale the start by -1 hour (i.e. 1 hour earlier).
      // The amount that you have to scale a child by is directly proportional
      //   to the child's length. So we calculate the proportion of durations using milliseconds.
      // Say you have a parent activity with three equally sized children. In that case,
      //   every child gets scaled down an equal amount, because they are all equally long.
      // If you plan your schedule with one slow group (long duration) and one fast group
      //   (short duration), the fast and short group only needs to be rescaled a little bit
      //   while the slow and long group gets the "lion share" of the scaling factor.
      const scalingFactor = childActivityLengthMs / rootActivityLengthMs;

      const childStartScale = rescaleIsoDuration(isoDeltaStart, scalingFactor);
      const childEndScale = rescaleIsoDuration(isoDeltaEnd, scalingFactor);

      // Of course, this all has to happen recursively because children can have children!
      const scaledChild = scaleActivitiesByDuration(
        childActivity,
        childStartScale,
        childEndScale,
      );

      // However, it doesn't end there. When a parent activity _scales_,
      //   the child activities also have to _move_. Think of an activity "shrinking",
      //   i.e. becoming shorter: Then the children also "shrink" as a result.
      // This "shrinking" will create gaps which can only be filled by the children
      //   _moving_ closer together after shrinking down.

      const ownStartToParentStart = millisecondsBetween(
        childActivity.startTime,
        activity.startTime,
      );

      const ownEndToParentEnd = millisecondsBetween(
        childActivity.endTime,
        activity.endTime,
      );

      // Again, this growth is proportional to the size of the child activity.
      const scalingStartUp = ownStartToParentStart / rootActivityLengthMs;
      const scalingEndDown = ownEndToParentEnd / rootActivityLengthMs;

      // Now it gets a little bit crazy:
      // - When applying a Delta to the END of the activity, we have to move it UP
      // - When applying a Delta to the START of the activity, we have to move it DOWN
      // Think of it this way: With two subsequent child activities, removing a few minutes
      //   from the END of either activity creates a gap that needs to be closed by moving
      //   the second, later activity UP closer towards its predecessor.
      // The same logic applies in reverse for adding minutes instead of removing minutes.
      const moveUpwardsDuration = rescaleIsoDuration(isoDeltaEnd, scalingStartUp);
      const moveDownwardsDuration = rescaleIsoDuration(isoDeltaStart, scalingEndDown);

      // Both directional Deltas are added together, and it is possible that they cancel
      //   each other out, most notably if DeltaStart == -DeltaEnd.
      const totalMovingDuration = addIsoDurations(moveUpwardsDuration, moveDownwardsDuration);

      // Phew, we're done.
      return moveActivityByDuration(scaledChild, totalMovingDuration);
    }),
  });
};

export const changeActivityTimezone = (activity, oldTimezone, newTimezone) => ({
  ...activity,
  startTime: changeTimezoneKeepingLocalTime(activity.startTime, oldTimezone, newTimezone),
  endTime: changeTimezoneKeepingLocalTime(activity.endTime, oldTimezone, newTimezone),
  childActivities: activity.childActivities.map((childActivity) => (
    changeActivityTimezone(
      childActivity,
      oldTimezone,
      newTimezone,
    )
  )),
});
