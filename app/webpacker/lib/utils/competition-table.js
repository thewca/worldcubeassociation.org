import React from 'react';
import { DateTime, Interval } from 'luxon';
import I18n from '../i18n';
import { defaultFallbackInView } from 'react-intersection-observer';

function parseDateString(yyyymmddDateString) {
  return DateTime.fromFormat(yyyymmddDateString, 'yyyy-MM-dd');
}

export function dayDifferenceFromToday(yyyymmddDateString) {
  const dateLuxon = parseDateString(yyyymmddDateString);
  const exactDaysDiff = dateLuxon.diffNow('days').days;

  if (dateLuxon > DateTime.now()) {
    return Math.ceil(exactDaysDiff);
  }

  return Math.floor(exactDaysDiff * -1);
}

export function startYear(competition) {
  const dateLuxon = parseDateString(competition.end_date);
  return dateLuxon.year;
}

export function isProbablyOver(competition) {
  if (!competition.end_date) return false;

  const dateLuxon = parseDateString(competition.end_date).endOf('day');
  return dateLuxon < DateTime.now();
}

export function isCancelled(competition) {
  return !!competition.cancelled_at;
}

export function hasResultsPosted(competition) {
  return !!competition.results_posted_at;
}

export function isInProgress(competition) {
  const startDate = parseDateString(competition.start_date).startOf('day');
  const endDate = parseDateString(competition.end_date).endOf('day');

  const running = Interval.fromDateTimes(startDate, endDate).contains(DateTime.now());

  return running && !hasResultsPosted(competition);
}

export function numberOfDaysBefore(competition, refDate) {
  const parsedRefDate = DateTime.fromISO(refDate);
  const parsedStartDate = parseDateString(competition.start_date).startOf('day');

  const numberOfDays = parsedStartDate.diff(parsedRefDate, 'days').days;

  return Math.ceil(Math.abs(numberOfDays));
}

export function timeDifferenceBefore(competition, refDate) {
  const amountOfDays = I18n.t('datetime.distance_in_words.x_days', { count: numberOfDaysBefore(competition, refDate) });
  return I18n.t('competitions.competition_info.relative_days.before', { amount_of_days: amountOfDays });
}

export function numberOfDaysAfter(competition, refDate) {
  const parsedStartDate = parseDateString(competition.end_date).endOf('day');
  const parsedRefDate = DateTime.fromISO(refDate);

  const numberOfDays = parsedStartDate.diff(parsedRefDate, 'days').days;

  return Math.ceil(Math.abs(numberOfDays));
}

export function timeDifferenceAfter(competition, refDate) {
  const amountOfDays = I18n.t('datetime.distance_in_words.x_days', { count: numberOfDaysAfter(competition, refDate) });
  return I18n.t('competitions.competition_info.relative_days.after', { amount_of_days: amountOfDays });
}

export function reportAdminCellContent(comp) {
  if (comp.report_posted_at) {
    const delegateIds = comp.delegates.map((delegate) => delegate.id);

    return delegateIds.includes(comp.report_posted_by_user)
      ? timeDifferenceAfter(comp, comp.report_posted_at)
      : I18n.t('competitions.competition_info.submitted_by_other');
  }

  if (isProbablyOver(comp)) {
    return I18n.t('competitions.competition_info.pending');
  }

  return null;
}

function lookupStatus(numOfDays, statusMap, compareFn, defaultStatus = null) {
  if (!Number.isInteger(numOfDays)) {
    return defaultStatus;
  }

  const entries = Object.entries(statusMap)
    .toSorted(([k1, v1], [k2, v2]) => (compareFn(v1, v2) ? 1 : -1));

  const deadlines = entries.map(([k, v]) => v);
  const statusClasses = entries.map(([k, v]) => k);

  const numOfMissedDeadlines = deadlines.filter((dl) => compareFn(numOfDays, dl)).length;

  return numOfMissedDeadlines === 0 ? defaultStatus : statusClasses[numOfMissedDeadlines - 1];
}

const announcementStatusLookup = {
  warning: 28,
  danger: 21,
};

export function computeAnnouncementStatus(comp) {
  const numOfDays = numberOfDaysBefore(comp, comp.announced_at);

  return lookupStatus(numOfDays, announcementStatusLookup, (a, b) => a < b, 'ok');
}

const reportResultsStatusLookup = {
  semi_ok: 7,
  warning: 14,
  danger: 21,
};

export function computeReportsAndResultsStatus(comp, refDate) {
  const numOfDays = numberOfDaysAfter(comp, refDate);
  const defaultStatus = refDate ? 'ok' : null;

  return lookupStatus(numOfDays, reportResultsStatusLookup, (a, b) => a > b, defaultStatus);
}

// Currently, the venue attribute of a competition object can be written as markdown,
// and using third party libraries like react-markdown to parse it requires too much work
export function PseudoLinkMarkdown({ text }) {
  const openBracketIndex = text.indexOf('[');
  const closeBracketIndex = text.indexOf(']', openBracketIndex);
  const openParenIndex = text.indexOf('(', closeBracketIndex);
  const closeParenIndex = text.indexOf(')', openParenIndex);

  if (openBracketIndex === -1 || closeBracketIndex === -1
    || openParenIndex === -1 || closeParenIndex === -1) {
    return <p>{text}</p>;
  }

  return (
    <p>
      <a href={text.slice(openParenIndex + 1, closeParenIndex)} target="_blank" rel="noreferrer">
        {text.slice(openBracketIndex + 1, closeBracketIndex)}
      </a>
    </p>
  );
}
