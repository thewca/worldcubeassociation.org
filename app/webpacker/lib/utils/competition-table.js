import React from 'react';
import { DateTime, Interval } from 'luxon';
import I18n from '../i18n';

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

  const dateLuxon = parseDateString(competition.end_date);
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
