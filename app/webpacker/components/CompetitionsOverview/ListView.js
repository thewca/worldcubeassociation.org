import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

import { Container } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import { competitionConstants } from '../../lib/wca-data.js.erb';

import ListViewSection from './ListViewSection';
import { isInProgress, isProbablyOver } from '../../lib/utils/competition-table';

function ListView({
  competitions,
  filterState,
  shouldShowRegStatus,
  shouldShowAdminDetails,
  isLoading,
  regStatusLoading,
  fetchMoreCompetitions,
  hasMoreCompsToLoad,
}) {
  const { ref: bottomRef, inView: bottomInView } = useInView();

  useEffect(() => {
    if (hasMoreCompsToLoad && bottomInView) {
      fetchMoreCompetitions();
    }
  }, [
    bottomInView,
    hasMoreCompsToLoad,
    fetchMoreCompetitions,
    // The bottom ref can still _stay_ in view even after loading new comps.
    //   In that case, the useEffect will not be triggered, so we introduce this extra dependency.
    competitions,
  ]);

  switch (filterState.timeOrder) {
    case 'present': {
      if (shouldShowAdminDetails) {
        return (
          <>
            <ListViewSection
              competitions={competitions}
              title={I18n.t('competitions.index.titles.ongoing_and_upcoming')}
              shouldShowRegStatus={shouldShowRegStatus}
              shouldShowAdminDetails={shouldShowAdminDetails}
              selectedDelegate={filterState.delegate}
              regStatusLoading={regStatusLoading}
              isLoading={isLoading}
              hasMoreCompsToLoad={hasMoreCompsToLoad}
            />
            <ListViewFooter
              isLoading={isLoading}
              hasMoreCompsToLoad={hasMoreCompsToLoad}
              numCompetitions={competitions?.length}
              bottomRef={bottomRef}
            />
          </>
        );
      }

      const inProgressComps = competitions?.filter((comp) => isInProgress(comp));

      const upcomingComps = competitions?.filter((comp) => (
        !isInProgress(comp) && !isProbablyOver(comp)
      ));

      return (
        <>
          <ListViewSection
            competitions={inProgressComps}
            title={I18n.t('competitions.index.titles.in_progress')}
            shouldShowRegStatus={shouldShowRegStatus}
            selectedDelegate={filterState.delegate}
            regStatusLoading={regStatusLoading}
            isLoading={isLoading && !upcomingComps?.length}
            hasMoreCompsToLoad={hasMoreCompsToLoad && !upcomingComps?.length}
          />
          <ListViewSection
            competitions={upcomingComps}
            title={I18n.t('competitions.index.titles.upcoming')}
            shouldShowRegStatus={shouldShowRegStatus}
            selectedDelegate={filterState.delegate}
            regStatusLoading={regStatusLoading}
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
          />
          <ListViewFooter
            isLoading={isLoading}
            hasMoreCompsToLoad={hasMoreCompsToLoad}
            numCompetitions={upcomingComps?.length}
            bottomRef={bottomRef}
          />
        </>
      );
    }
    case 'recent':
      return (
        <div id="competitions-list">
          <ListViewSection
            competitions={competitions}
            title={I18n.t('competitions.index.titles.recent', { count: competitionConstants.competitionRecentDays })}
            shouldShowRegStatus={shouldShowRegStatus}
            shouldShowAdminDetails={shouldShowAdminDetails}
            selectedDelegate={filterState.delegate}
            isLoading={isLoading}
            regStatusLoading={regStatusLoading}
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
            shouldShowAdminDetails={shouldShowAdminDetails}
            selectedDelegate={filterState.delegate}
            isLoading={isLoading}
            regStatusLoading={regStatusLoading}
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
            shouldShowAdminDetails={shouldShowAdminDetails}
            selectedDelegate={filterState.delegate}
            isLoading={isLoading}
            regStatusLoading={regStatusLoading}
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
            shouldShowAdminDetails={shouldShowAdminDetails}
            selectedDelegate={filterState.delegate}
            isLoading={isLoading}
            regStatusLoading={regStatusLoading}
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
  if (!isLoading && !hasMoreCompsToLoad) {
    return numCompetitions > 0 && (
      <Container text textAlign="center">
        {I18n.t('competitions.index.no_more_comps')}
      </Container>
    );
  }

  return <div ref={bottomRef} name="page-bottom" />;
}

export default ListView;
