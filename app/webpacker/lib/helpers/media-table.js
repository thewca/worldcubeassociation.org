/* eslint import/prefer-default-export: "off" */
export function dateRangeBetween(fromDate, toDate) {
  const format = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const date1 = new Date(fromDate);
  const date2 = new Date(toDate);

  // Validate date1 and date2
  if (Number.isNaN(date1.getTime()) || Number.isNaN(date2.getTime())) {
    return 'Invalid Date Range';
  }

  const ans = format.formatRange(date1, date2);
  return ans;
}
