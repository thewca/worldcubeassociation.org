import React from 'react';

import I18n from '../../lib/i18n';

function renderYearHeader(competitions, index, sortByAnnouncement) {
  if (index > 0 && competitions[index].year !== competitions[index - 1].year
    && !sortByAnnouncement) {
    return <li className="list-group-item break">{competitions[index].year}</li>;
  }
  return null;
}

function renderDateIcon(comp, showRegistrationStatus, sortByAnnouncement) {
  if (comp.isProbablyOver) {
    if (comp.resultsPosted) {
      return <i className="icon check circle result-posted-indicator" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.posted')} />;
    }

    const dateToday = new Date();
    const endDate = new Date(comp.end_date);
    const msDifference = dateToday.getTime() - endDate.getTime();
    const dayDifference = Math.floor(msDifference / (1000 * 3600 * 24));

    return <i className="icon hourglass end" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.ended', { days: I18n.t('common.days', { count: dayDifference }) })} />;
  }
  if (comp.inProgress) {
    return <i className="icon hourglass half" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.in_progress')} />;
  }
  if (sortByAnnouncement) {
    return <i className="icon hourglass start" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.announced_on', { announcement_date: comp.announcedDate })} />;
  }
  if (showRegistrationStatus) {
    return null;
  }

  const dateToday = new Date();
  const startDate = new Date(comp.start_date);
  const msDifference = startDate.getTime() - dateToday.getTime();
  const dayDifference = Math.ceil(msDifference / (1000 * 3600 * 24));

  return <i className="icon hourglass end" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.starts_in', { days: I18n.t('common.days', { count: dayDifference }) })} />;
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
        <>
          {renderYearHeader(competitions, index, sortByAnnouncement)}
          <li key={comp.id} className={`list-group-item${comp.isProbablyOver ? ' past' : ' not-past'}${comp.cancelled ? ' cancelled' : ''}`}>
            <span className="date">
              {renderDateIcon(comp, showRegistrationStatus, sortByAnnouncement)}
              {comp.dateRange}
            </span>
            <span className="competition-info">
              <div className="competition-link">
                {comp.displayName}
              </div>
              <div className="location">
                <strong>{comp.countryName}</strong>
                {`, ${comp.cityName}`}
              </div>
              <div className="venue-link">
                123
              </div>
            </span>
          </li>
        </>
      ))}
    </ul>
  );
}

export default CompetitionTable;
