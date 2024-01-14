import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

import I18n from '../../lib/i18n';
import { competitionConstants } from '../../lib/wca-data.js.erb';

import ListViewSection from './ListViewSection';

function ListView({
  competitions,
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
      const inProgressComps = competitions?.filter((comp) => comp.inProgress);
      const upcomingComps = competitions?.filter((comp) => !comp.inProgress);
      return (
        <div id="competitions-list">
          <ListViewSection
            competitions={inProgressComps}
            title={I18n.t('competitions.index.titles.in_progress')}
            shouldShowRegStatus={shouldShowRegStatus}
            isLoading={isLoading && !upcomingComps?.length}
            hasMoreCompsToLoad={hasMoreCompsToLoad && !upcomingComps?.length}
            shouldShowEndOfListMsg={false}
          />
          <ListViewSection
            competitions={upcomingComps}
            title={I18n.t('competitions.index.titles.upcoming')}
            shouldShowRegStatus={shouldShowRegStatus}
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
          <ListViewSection
            competitions={competitions}
            title={I18n.t('competitions.index.titles.recent', { count: competitionConstants.competitionRecentDays })}
            shouldShowRegStatus={shouldShowRegStatus}
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          {!isLoading && hasMoreCompsToLoad && <div ref={bottomRef} name="page-bottom" />}
        </div>
      );
    case 'past':
      return (
        <div id="competitions-list">
          <ListViewSection
            competitions={competitions}
            title={filterState.selectedYear === 'all_years' ? I18n.t('competitions.index.titles.past_all') : I18n.t('competitions.index.titles.past', { year: filterState.selectedYear })}
            shouldShowRegStatus={shouldShowRegStatus}
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          {!isLoading && hasMoreCompsToLoad && <div ref={bottomRef} name="page-bottom" />}
        </div>
      );
    case 'by_announcement':
      return (
        <div id="competitions-list">
          <ListViewSection
            competitions={competitions}
            title={I18n.t('competitions.index.titles.by_announcement')}
            shouldShowRegStatus={shouldShowRegStatus}
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
          <ListViewSection
            competitions={competitions}
            title={I18n.t('competitions.index.titles.custom')}
            shouldShowRegStatus={shouldShowRegStatus}
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

export default ListView;
