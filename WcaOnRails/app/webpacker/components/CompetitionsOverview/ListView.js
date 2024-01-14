import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader } from 'semantic-ui-react';

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
    if (hasMoreCompsToLoad && bottomInView) {
      fetchMoreCompetitions();
    }
  }, [bottomInView, hasMoreCompsToLoad, fetchMoreCompetitions]);

  switch (filterState.timeOrder) {
    case 'present': {
      const inProgressComps = competitions?.filter((comp) => comp.inProgress);
      const upcomingComps = competitions?.filter((comp) => (
        !comp.inProgress && !comp.isProbablyOver
      ));
      return (
        <div id="competitions-list">
          <ListViewSection
            competitions={inProgressComps}
            title={I18n.t('competitions.index.titles.in_progress')}
            shouldShowRegStatus={shouldShowRegStatus}
            hasMoreCompsToLoad={hasMoreCompsToLoad && !upcomingComps?.length}
          />
          <ListViewSection
            competitions={upcomingComps}
            title={I18n.t('competitions.index.titles.upcoming')}
            shouldShowRegStatus={shouldShowRegStatus}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          <ListViewFooter
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
            numCompetitions={competitions?.length}
            bottomRef={bottomRef}
          />
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
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          <ListViewFooter
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
            numCompetitions={competitions?.length}
            bottomRef={bottomRef}
          />
        </div>
      );
    case 'past':
      return (
        <div id="competitions-list">
          <ListViewSection
            competitions={competitions}
            title={filterState.selectedYear === 'all_years' ? I18n.t('competitions.index.titles.past_all') : I18n.t('competitions.index.titles.past', { year: filterState.selectedYear })}
            shouldShowRegStatus={shouldShowRegStatus}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          <ListViewFooter
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
            numCompetitions={competitions?.length}
            bottomRef={bottomRef}
          />
        </div>
      );
    case 'by_announcement':
      return (
        <div id="competitions-list">
          <ListViewSection
            competitions={competitions}
            title={I18n.t('competitions.index.titles.by_announcement')}
            shouldShowRegStatus={shouldShowRegStatus}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
            isSortedByAnnouncement
          />
          <ListViewFooter
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
            numCompetitions={competitions?.length}
            bottomRef={bottomRef}
          />
        </div>
      );
    case 'custom':
      return (
        <div id="competitions-list">
          <ListViewSection
            competitions={competitions}
            title={I18n.t('competitions.index.titles.custom')}
            shouldShowRegStatus={shouldShowRegStatus}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          <ListViewFooter
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
            numCompetitions={competitions?.length}
            bottomRef={bottomRef}
          />
        </div>
      );
    default:
      return {};
  }
}

function ListViewFooter({
  isLoading, hasMoreCompsToLoad, numCompetitions, bottomRef,
}) {
  if (isLoading) {
    /* Could not figure out why Semantic UI's animated loader icon doesn't show */
    return (
      <Loader active inline="centered" size="small">
        <div style={{ textAlign: 'center' }}>
          {I18n.t('competitions.index.loading_comps')}
        </div>
      </Loader>
    );
  }

  if (!hasMoreCompsToLoad) {
    return (
      <div style={{ textAlign: 'center' }}>
        {numCompetitions > 0 ? I18n.t('competitions.index.no_more_comps') : I18n.t('competitions.index.no_comp_found')}
      </div>
    );
  }

  return <div ref={bottomRef} name="page-bottom" />;
}

export default ListView;
