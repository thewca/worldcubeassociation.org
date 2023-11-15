export function dateRangeBetween(fromDate, toDate) {
    const format = new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const date1 = new Date(fromDate);
    const date2 = new Date(toDate);
    const ans = format.formatRange(date1, date2);
    return ans;
  }