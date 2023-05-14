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
    return <i className="icon hourglass end" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.ended', { days: I18n.t('common.days', { count: 1 }) })} />;
  }
  if (comp.inProgress) {
    return <i className="icon hourglass half" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.in_progress')} />;
  }
  if (sortByAnnouncement) {
    return <i className="icon hourglass start" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.announced_on', { announcement_date: '' })} />;
  }
  if (showRegistrationStatus) {
    return null;
  }
  return <i className="icon hourglass end" data-toggle="tooltip" data-original-title={I18n.t('competitions.index.tooltips.hourglass.start_in', { days: I18n.t('common.days', { count: 1 }) })} />;
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
