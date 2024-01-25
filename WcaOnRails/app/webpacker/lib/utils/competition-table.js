import React from 'react';
import { DateTime, Interval } from 'luxon';

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

export function yearFromDateString(yyyymmddDateString) {
  const dateLuxon = parseDateString(yyyymmddDateString);
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
  const startDate = parseDateString(competition.start_date);
  const endDate = parseDateString(competition.end_date);

  const running = Interval.fromDateTimes(startDate, endDate).contains(DateTime.now());

  return running && !hasResultsPosted(competition);
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
