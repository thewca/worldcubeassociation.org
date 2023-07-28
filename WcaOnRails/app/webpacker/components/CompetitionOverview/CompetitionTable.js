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
    return <i className="icon clock blue" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.registration.opens_in', { duration: comp.timeUntilRegistration })} />;
  }
  if (comp.registration_status === 'past') {
    return <i className="icon user times red" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.registration.closed', { days: I18n.t('common.days', { count: calculateDayDifference(comp, 'future') }) })} />;
  }
  if (comp.registration_status === 'full') {
    return <i className="icon user clock orange" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.registration.full')} />;
  }

  return <i className="icon user plus green" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.registration.open')} />;
}

function renderDateIcon(comp, showRegistrationStatus, sortByAnnouncement) {
  if (comp.isProbablyOver) {
    if (comp.resultsPosted) {
      return <i className="icon check circle result-posted-indicator" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.posted')} />;
    }

    return <i className="icon hourglass end" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.ended', { days: I18n.t('common.days', { count: calculateDayDifference(comp, 'past') }) })} />;
  }
  if (comp.inProgress) {
    return <i className="icon hourglass half" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.in_progress')} />;
  }
  if (sortByAnnouncement) {
    return <i className="icon hourglass start" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.announced_on', { announcement_date: comp.announcedDate })} />;
  }
  if (showRegistrationStatus) {
    return renderRegistrationStatus(comp);
  }

  return <i className="icon hourglass start" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.starts_in', { days: I18n.t('common.days', { count: calculateDayDifference(comp, 'future') }) })} />;
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
          {shouldShowYearHeader(competitions, index, sortByAnnouncement) && <li className="list-group-item break">{comp.year}</li>}
          <li className={`list-group-item${comp.isProbablyOver ? ' past' : ' not-past'}${comp.cancelled ? ' cancelled' : ''}`}>
            <span className="date">
              {renderDateIcon(comp, showRegistrationStatus, sortByAnnouncement)}
              {comp.dateRange}
            </span>
            <span className="competition-info">
              <div className="competition-link">
                <span className={` fi fi-${comp.country_iso2}`} />
                &nbsp;
                <a href={comp.url}>{comp.displayName}</a>
              </div>
              <div className="location">
                <strong>{comp.countryName}</strong>
                {`, ${comp.cityName}`}
              </div>
              <div className="venue-link">
                <ReactMarkdown linkTarget="_blank">{comp.venue}</ReactMarkdown>
              </div>
            </span>
          </li>
        </React.Fragment>
      ))}
    </ul>
  );
}

export default CompetitionTable;
