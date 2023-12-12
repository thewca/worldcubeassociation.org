import {
  changeTimezoneKeepingLocalTime,
  moveByIsoDuration,
  rescaleDuration,
} from '../../lib/utils/edit-schedule';

export const moveActivityByDuration = (activity, isoDuration) => ({
  ...activity,
  startTime: moveByIsoDuration(activity.startTime, isoDuration),
  endTime: moveByIsoDuration(activity.endTime, isoDuration),
  childActivities: activity.childActivities.map((childActivity) => (
    moveActivityByDuration(childActivity, isoDuration)
  )),
});

export const scaleActivitiesByDuration = (activity, isoDeltaStart, isoDeltaEnd) => ({
  ...activity,
  startTime: moveByIsoDuration(activity.startTime, isoDeltaStart),
  endTime: moveByIsoDuration(activity.endTime, isoDeltaEnd),
  childActivities: activity.childActivities.map((childActivity, childIdx) => {
    // Unfortunately, scaling child activities (properly) is rocket science.
    const nChildren = activity.childActivities.length;

    // Say you have a parent activity with n=3 children,
    // and you scale the start by -1 hour (i.e. 1 hour earlier).
    //   In that case, the first child activity's start also has to be scaled by 1 hour.
    // However, the second child activity's start only has to be scaled by 2/3 of 1 hour,
    //   and the last has to be scaled by only 1/3 of 1 hour.
    // In general, the i-th child of n children scales by (n-i)/n for the start of the activity.
    const startScaleUp = (nChildren - childIdx) / nChildren;

    // However, it doesn't end there. When a parent activity's _start_ scales,
    //   only the startTime has to be manipulated.
    // But for the children, the _endTime_ ALSO has to be manipulated
    //   because even though only the start of the parent changes,
    //   the children _move_ within that scaled parent as a whole.
    // The scaling factor for the end of a child is the same as the scaling factor
    //   for the start of the _next_ child.
    const endScaleUp = (nChildren - (childIdx + 1)) / nChildren;

    const childDeltaStartUp = rescaleDuration(isoDeltaStart, startScaleUp);
    const childDeltaEndUp = rescaleDuration(isoDeltaStart, endScaleUp);

    // Of course, this all has to happen recursively because children can have children!
    const startScaledChild = scaleActivitiesByDuration(
      childActivity,
      childDeltaStartUp,
      childDeltaEndUp,
    );

    // And it gets even more crazy:
    //   The same (n-i)/n logic from above has to be applied to the endDate as well,
    //   but of course IN REVERSE! So the _last_ child moves the full amount,
    //   the second-to-last child moves a little less, and the first child only moves a tiny bit.
    const startScaleDown = childIdx / nChildren;
    const endScaleDown = (childIdx + 1) / nChildren;

    const childDeltaStartDown = rescaleDuration(isoDeltaEnd, startScaleDown);
    const childDeltaEndDown = rescaleDuration(isoDeltaEnd, endScaleDown);

    // Phew, we're done.
    return scaleActivitiesByDuration(startScaledChild, childDeltaStartDown, childDeltaEndDown);
  }),
});

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
