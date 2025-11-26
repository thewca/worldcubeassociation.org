export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  const dayFormatter = new Intl.DateTimeFormat("en-US", { day: "numeric" });
  const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const fullFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (sameDay) return fullFormatter.format(startDate);

  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const sameYear = startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth && sameYear) {
    return `${monthDayFormatter.format(startDate)} - ${dayFormatter.format(endDate)}, ${startDate.getFullYear()}`;
  }

  if (sameYear) {
    return `${monthDayFormatter.format(startDate)} - ${monthDayFormatter.format(endDate)}, ${startDate.getFullYear()}`;
  }

  return `${fullFormatter.format(startDate)} - ${fullFormatter.format(endDate)}`;
}
