import React from 'react';
import { DateTime, Interval } from 'luxon';
import I18n from '../i18n';

function parseDateString(yyyymmddDateString) {
  return DateTime.fromFormat(yyyymmddDateString, 'yyyy-MM-dd', { zone: 'utc' });
}

const registrationStatusHint = (competingStatus) => {
  if (competingStatus === 'waiting_list') {
    return I18n.t('competitions.messages.tooltip_waiting_list');
  } if (competingStatus === 'accepted') {
    return I18n.t('competitions.messages.tooltip_registered');
  } if (competingStatus === 'cancelled' || competingStatus === 'rejected') {
    return I18n.t('competitions.messages.tooltip_deleted');
  } if (competingStatus === 'pending') {
    return I18n.t('competitions.messages.tooltip_pending');
  }
  return '';
};

const competitionStatusHint = (competition) => {
  let text = '';
  if (!competition['confirmed?']) {
    text += I18n.t('competitions.messages.not_confirmed_not_visible');
  } else if (!competition['visible?']) {
    text += I18n.t('competitions.messages.confirmed_not_visible');
  } else {
    text += I18n.t('competitions.messages.confirmed_visible');
  }

  return text;
};

export const competitionStatusText = (competition, registrationStatus) => `${registrationStatusHint(registrationStatus)} ${competitionStatusHint(competition)}`;

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
  const parsedEndDate = parseDateString(competition.end_date).startOf('day');
  const parsedRefDate = DateTime.fromISO(refDate, { zone: 'utc' }).startOf('day');

  return parsedRefDate.diff(parsedEndDate, 'days').days;
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

export function resultsSubmittedAtAdminCellContent(comp) {
  if (comp.results_submitted_at) {
    return timeDifferenceAfter(comp, comp.results_submitted_at);
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
    .toSorted(([, v1], [, v2]) => (compareFn(v1, v2) ? 1 : -1));

  const deadlines = entries.map(([, v]) => v);
  const statusClasses = entries.map(([k]) => k);

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
export function PseudoLinkMarkdown({ text, RenderAs = 'p' }) {
  const openBracketIndex = text.indexOf('[');
  const closeBracketIndex = text.indexOf(']', openBracketIndex);
  const openParenIndex = text.indexOf('(', closeBracketIndex);
  const closeParenIndex = text.indexOf(')', openParenIndex);

  if (openBracketIndex === -1 || closeBracketIndex === -1
    || openParenIndex === -1 || closeParenIndex === -1) {
    return <RenderAs>{text}</RenderAs>;
  }

  return (
    <RenderAs>
      <a href={text.slice(openParenIndex + 1, closeParenIndex)} target="_blank" rel="noreferrer">
        {text.slice(openBracketIndex + 1, closeBracketIndex)}
      </a>
    </RenderAs>
  );
}
