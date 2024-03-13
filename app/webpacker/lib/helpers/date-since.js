import { DateTime } from 'luxon';

const dateSince = (date) => {
  if (!date) {
    return null;
  }
  const now = DateTime.local();
  const then = DateTime.fromISO(date);
  const diff = now.diff(then, ['years', 'months', 'days']);
  return Math.floor(diff.as('days'));
};

export default dateSince;
