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
  shouldShowAdminDetails,
  isLoading,
  fetchMoreCompetitions,
  hasMoreCompsToLoad,
}) {
  const { ref: bottomRef, inView: bottomInView } = useInView();

  useEffect(() => {
    if (hasMoreCompsToLoad && bottomInView && !isLoading) {
      fetchMoreCompetitions();
    }
  }, [
    hasMoreCompsToLoad,
    bottomInView,
    isLoading,
    fetchMoreCompetitions,
  ]);

  switch (filterState.timeOrder) {
    case 'present': {
      if (shouldShowAdminDetails) {
        return (
          <>
            <ListViewSection
              competitions={competitions}
              title={I18n.t('competitions.index.titles.ongoing_and_upcoming')}
              shouldShowAdminDetails={shouldShowAdminDetails}
              selectedDelegate={filterState.delegate}
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
          {inProgressComps?.length > 0 && (
            <ListViewSection
              competitions={inProgressComps}
              title={I18n.t('competitions.index.titles.in_progress')}
              selectedDelegate={filterState.delegate}
              isLoading={isLoading && !upcomingComps?.length}
              hasMoreCompsToLoad={hasMoreCompsToLoad && !upcomingComps?.length}
            />
          )}
          <ListViewSection
            competitions={upcomingComps}
            title={I18n.t('competitions.index.titles.upcoming')}
            selectedDelegate={filterState.delegate}
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
            shouldShowAdminDetails={shouldShowAdminDetails}
            selectedDelegate={filterState.delegate}
            isLoading={isLoading}
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
            shouldShowAdminDetails={shouldShowAdminDetails}
            selectedDelegate={filterState.delegate}
            isLoading={isLoading}
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
            shouldShowAdminDetails={shouldShowAdminDetails}
            selectedDelegate={filterState.delegate}
            isLoading={isLoading}
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
            shouldShowAdminDetails={shouldShowAdminDetails}
            selectedDelegate={filterState.delegate}
            isLoading={isLoading}
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
