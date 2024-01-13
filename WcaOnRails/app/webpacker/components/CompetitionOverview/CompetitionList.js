import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

import I18n from '../../lib/i18n';
import { competitionConstants } from '../../lib/wca-data.js.erb';

// Should CompetitionTable be renamed to CompetitionSubList or something?
import CompetitionTable from './CompetitionTable';

function CompetitionList({
  competitionData,
  filterState,
  shouldShowRegStatus,
  isLoading,
  fetchMoreCompetitions,
  hasMoreCompsToLoad,
}) {
  const { ref: bottomRef, inView: bottomInView } = useInView();
  useEffect(() => {
    if (bottomInView) {
      fetchMoreCompetitions();
    }
  }, [bottomInView, fetchMoreCompetitions]);

  switch (filterState.timeOrder) {
    case 'present': {
      const inProgressComps = competitionData?.filter((comp) => comp.inProgress);
      const upcomingComps = competitionData?.filter((comp) => !comp.inProgress);
      return (
        <div id="competitions-list">
          <CompetitionTable
            competitionData={inProgressComps}
            title={I18n.t('competitions.index.titles.in_progress')}
            shouldShowRegStatus={shouldShowRegStatus}
            shouldIncludeCancelled={filterState.shouldIncludeCancelled}
            selectedEvents={filterState.selectedEvents}
            isLoading={isLoading && !upcomingComps?.length}
            hasMoreCompsToLoad={hasMoreCompsToLoad && !upcomingComps?.length}
            isRenderedAboveAnotherTable
          />
          <CompetitionTable
            competitionData={upcomingComps}
            title={I18n.t('competitions.index.titles.upcoming')}
            shouldShowRegStatus={shouldShowRegStatus}
            shouldIncludeCancelled={filterState.shouldIncludeCancelled}
            selectedEvents={filterState.selectedEvents}
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          {!isLoading && hasMoreCompsToLoad && <div ref={bottomRef} name="page-bottom" />}
        </div>
      );
    }
    case 'recent':
      return (
        <div id="competitions-list">
          <CompetitionTable
            competitionData={competitionData}
            title={I18n.t('competitions.index.titles.recent', { count: competitionConstants.competitionRecentDays })}
            shouldShowRegStatus={shouldShowRegStatus}
            shouldIncludeCancelled={filterState.shouldIncludeCancelled}
            selectedEvents={filterState.selectedEvents}
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          {!isLoading && hasMoreCompsToLoad && <div ref={bottomRef} name="page-bottom" />}
        </div>
      );
    case 'past':
      return (
        <div id="competitions-list">
          <CompetitionTable
            competitionData={competitionData}
            title={filterState.selectedYear === 'all_years' ? I18n.t('competitions.index.titles.past_all') : I18n.t('competitions.index.titles.past', { year: filterState.selectedYear })}
            shouldShowRegStatus={shouldShowRegStatus}
            shouldIncludeCancelled={filterState.shouldIncludeCancelled}
            selectedEvents={filterState.selectedEvents}
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          {!isLoading && hasMoreCompsToLoad && <div ref={bottomRef} name="page-bottom" />}
        </div>
      );
    case 'by_announcement':
      return (
        <div id="competitions-list">
          <CompetitionTable
            competitionData={competitionData}
            title={I18n.t('competitions.index.titles.by_announcement')}
            shouldShowRegStatus={shouldShowRegStatus}
            shouldIncludeCancelled={filterState.shouldIncludeCancelled}
            selectedEvents={filterState.selectedEvents}
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
            isSortedByAnnouncement
          />
          {!isLoading && hasMoreCompsToLoad && <div ref={bottomRef} name="page-bottom" />}
        </div>
      );
    case 'custom':
      return (
        <div id="competitions-list">
          <CompetitionTable
            competitionData={competitionData}
            title={I18n.t('competitions.index.titles.custom')}
            shouldShowRegStatus={shouldShowRegStatus}
            shouldIncludeCancelled={filterState.shouldIncludeCancelled}
            selectedEvents={filterState.selectedEvents}
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          {!isLoading && hasMoreCompsToLoad && <div ref={bottomRef} name="page-bottom" />}
        </div>
      );
    default:
      return {};
  }
}

export default CompetitionList;
