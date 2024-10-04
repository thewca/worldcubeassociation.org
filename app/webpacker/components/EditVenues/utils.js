import { changeTimezoneKeepingLocalTime } from '../../lib/utils/edit-schedule';

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
