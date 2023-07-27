import React from 'react';
import ReactMarkdown from 'react-markdown';

import I18n from '../../lib/i18n';

function calculateDayDifference(comp, mode) {
  const dateToday = new Date();
  const startDate = new Date(comp.start_date);
  const endDate = new Date(comp.end_date);
  const msInADay = 1000 * 3600 * 24;

  if (mode === 'future') {
    const msDifference = startDate.getTime() - dateToday.getTime();
    const dayDifference = Math.ceil(msDifference / msInADay);
    return dayDifference;
  }
  if (mode === 'past') {
    const msDifference = dateToday.getTime() - endDate.getTime();
    const dayDifference = Math.floor(msDifference / msInADay);
    return dayDifference;
  }

  return -1;
}

function shouldShowYearHeader(competitions, index, sortByAnnouncement) {
  return index > 0 && competitions[index].year !== competitions[index - 1].year
  && !sortByAnnouncement;
}

function renderRegistrationStatus(comp) {
  if (comp.registration_status === 'not_yet_opened') {
    return <i key={`${comp.id} status-icon`} className="icon clock blue" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.registration.opens_in', { duration: comp.timeUntilRegistration })} />;
  }
  if (comp.registration_status === 'past') {
    return <i key={`${comp.id} status-icon`} className="icon user times red" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.registration.closed', { days: I18n.t('common.days', { count: calculateDayDifference(comp, 'future') }) })} />;
  }
  if (comp.registration_status === 'full') {
    return <i key={`${comp.id} status-icon`} className="icon user clock orange" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.registration.full')} />;
  }

  return <i key={`${comp.id} status-icon`} className="icon user plus green" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.registration.open')} />;
}

function renderDateIcon(comp, showRegistrationStatus, sortByAnnouncement) {
  if (comp.isProbablyOver) {
    if (comp.resultsPosted) {
      return <i key={`${comp.id} status-icon`} className="icon check circle result-posted-indicator" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.posted')} />;
    }

    return <i key={`${comp.id} status-icon`} className="icon hourglass end" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.ended', { days: I18n.t('common.days', { count: calculateDayDifference(comp, 'past') }) })} />;
  }
  if (comp.inProgress) {
    return <i key={`${comp.id} status-icon`} className="icon hourglass half" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.in_progress')} />;
  }
  if (sortByAnnouncement) {
    return <i key={`${comp.id} status-icon`} className="icon hourglass start" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.announced_on', { announcement_date: comp.announcedDate })} />;
  }
  if (showRegistrationStatus) {
    return renderRegistrationStatus(comp);
  }

  return <i key={`${comp.id} status-icon`} className="icon hourglass start" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.starts_in', { days: I18n.t('common.days', { count: calculateDayDifference(comp, 'future') }) })} />;
}

function CompetitionTable({
  competitions,
  title,
  showRegistrationStatus,
  sortByAnnouncement = false,
}) {
  return (
    <ul className="list-group">
      <li className="list-group-item">
        <strong>
          {`${title} (${competitions.length})`}
        </strong>
      </li>
      {competitions.map((comp, index) => (
        <React.Fragment key={comp.id}>
          {shouldShowYearHeader(competitions, index, sortByAnnouncement) && <li key={`${comp.id} ${comp.year} new-year-header`} className="list-group-item break">{comp.year}</li>}
          <li key={`${comp.id} comp-li`} className={`list-group-item${comp.isProbablyOver ? ' past' : ' not-past'}${comp.cancelled ? ' cancelled' : ''}`}>
            <span key={`${comp.id} date-info`} className="date">
              {renderDateIcon(comp, showRegistrationStatus, sortByAnnouncement)}
              {comp.dateRange}
            </span>
            <span key={`${comp.id} comp-info`} className="competition-info">
              <div key={`${comp.id} link`} className="competition-link">
                <span key={`${comp.id} flag-icon`} className={` fi fi-${comp.country_iso2}`} />
                &nbsp;
                <a key={`${comp.id} name-url`} href={comp.url}>{comp.displayName}</a>
              </div>
              <div key={`${comp.id} location`} className="location">
                <strong key={`${comp.id} country-name`}>{comp.countryName}</strong>
                {`, ${comp.cityName}`}
              </div>
              <div key={`${comp.id} venue`} className="venue-link">
                <ReactMarkdown key={`${comp.id} venue-md`} linkTarget="_blank">{comp.venue}</ReactMarkdown>
              </div>
            </span>
          </li>
        </React.Fragment>
      ))}
    </ul>
  );
}

export default CompetitionTable;
