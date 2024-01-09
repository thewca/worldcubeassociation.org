import React from 'react';

import I18n from '../../lib/i18n';
import { competitionConstants } from '../../lib/wca-data.js.erb';

// Should CompetitionTable be renamed to CompetitionSubList or something?
import CompetitionTable from './CompetitionTable';

function CompetitionList({
  competitionData,
  filterState,
  shouldShowRegStatus,
  shouldIncludeCancelled,
  selectedEvents,
  isLoading,
  hasMoreCompsToLoad,
}) {
  switch (filterState.timeOrder) {
    case 'present':
      return (
        <>
          <CompetitionTable
            competitionData={competitionData?.filter((comp) => comp.inProgress)}
            title={I18n.t('competitions.index.titles.in_progress')}
            shouldShowRegStatus={shouldShowRegStatus}
            shouldIncludeCancelled={shouldIncludeCancelled}
            selectedEvents={selectedEvents}
            isLoading={isLoading
              && !competitionData?.filter((comp) => !comp.inProgress)}
            hasMoreCompsToLoad={hasMoreCompsToLoad
              && !competitionData?.filter((comp) => !comp.inProgress)}
            isRenderedAboveAnotherTable
          />
          <CompetitionTable
            competitionData={competitionData?.filter((comp) => !comp.inProgress)}
            title={I18n.t('competitions.index.titles.upcoming')}
            shouldShowRegStatus={shouldShowRegStatus}
            shouldIncludeCancelled={shouldIncludeCancelled}
            selectedEvents={selectedEvents}
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
        </>
      );
    case 'recent':
      return (
        <CompetitionTable
          competitionData={competitionData}
          title={I18n.t('competitions.index.titles.recent', { count: competitionConstants.competitionRecentDays })}
          shouldShowRegStatus={shouldShowRegStatus}
          shouldIncludeCancelled={shouldIncludeCancelled}
          selectedEvents={selectedEvents}
          isLoading={isLoading}
          hasMoreCompsToLoad={hasMoreCompsToLoad}
        />
      );
    case 'past':
      return (
        <CompetitionTable
          competitionData={competitionData}
          title={filterState.selectedYear === 'all_years' ? I18n.t('competitions.index.titles.past_all') : I18n.t('competitions.index.titles.past', { year: filterState.selectedYear })}
          shouldShowRegStatus={shouldShowRegStatus}
          shouldIncludeCancelled={shouldIncludeCancelled}
          selectedEvents={selectedEvents}
          isLoading={isLoading}
          hasMoreCompsToLoad={hasMoreCompsToLoad}
        />
      );
    case 'by_announcement':
      return (
        <CompetitionTable
          competitionData={competitionData}
          title={I18n.t('competitions.index.titles.by_announcement')}
          shouldShowRegStatus={shouldShowRegStatus}
          shouldIncludeCancelled={shouldIncludeCancelled}
          selectedEvents={selectedEvents}
          isLoading={isLoading}
          hasMoreCompsToLoad={hasMoreCompsToLoad}
          isSortedByAnnouncement
        />
      );
    case 'custom':
      return (
        <CompetitionTable
          competitionData={competitionData}
          title={I18n.t('competitions.index.titles.custom')}
          shouldShowRegStatus={shouldShowRegStatus}
          shouldIncludeCancelled={shouldIncludeCancelled}
          selectedEvents={selectedEvents}
          isLoading={isLoading}
          hasMoreCompsToLoad={hasMoreCompsToLoad}
        />
      );
    default:
      return {};
  }
}

export default CompetitionList;
