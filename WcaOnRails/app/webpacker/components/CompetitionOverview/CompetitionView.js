import React, {
  useEffect, useReducer, useMemo,
} from 'react';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Container } from 'semantic-ui-react';

import I18n from '../../lib/i18n';
import { competitionsApiUrl, WCA_API_PAGINATION } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

import CompetitionFilters from './CompetitionFilters';
import CompetitionList from './CompetitionList';
import CompetitionMap, { MAP_DISPLAY_LIMIT } from './CompetitionMap';
import { filterReducer, filterInitialState } from './filterUtils';
import { calculateQueryKey, createSearchParams } from './queryUtils';

function CompetitionView() {
  const [filterState, dispatchFilter] = useReducer(filterReducer, filterInitialState);
  const competitionQueryKey = useMemo(() => calculateQueryKey(filterState), [filterState]);

  const {
    data: rawCompetitionData,
    fetchNextPage: competitionsFetchNextPage,
    isFetching: competitionsIsFetching,
    hasNextPage: hasMoreCompsToLoad,
  } = useInfiniteQuery({
    queryKey: ['competitions', competitionQueryKey],
    queryFn: ({ pageParam = 1 }) => {
      const searchParams = createSearchParams(filterState, pageParam);
      return fetchJsonOrError(`${competitionsApiUrl}?${searchParams}`);
    },
    getNextPageParam: (previousPage, allPages) => {
      // Continue until less than a full page of data is fetched,
      // which indicates the very last page.
      if (previousPage.data.length < WCA_API_PAGINATION) {
        return undefined;
      }
      return allPages.length + 1;
    },
  });
  const competitionData = rawCompetitionData?.pages.flatMap((page) => page.data);

  const { ref: bottomRef, inView: bottomInView } = useInView();
  useEffect(() => {
    if (bottomInView) {
      competitionsFetchNextPage();
    }
  }, [bottomInView, competitionsFetchNextPage]);

  useEffect(() => {
    if (hasMoreCompsToLoad && filterState.displayMode === 'map' && competitionData?.length < MAP_DISPLAY_LIMIT) {
      competitionsFetchNextPage();
    }
  }, [rawCompetitionData, filterState.displayMode, hasMoreCompsToLoad, competitionData,
    competitionsFetchNextPage]);

  return (
    <Container>
      <h2>{I18n.t('competitions.index.title')}</h2>
      <CompetitionFilters filterState={filterState} dispatchFilter={dispatchFilter} />

      <Container id="search-results" className="row competitions-list">
        <div id="competitions-list">
          {
            filterState.displayMode === 'list'
            && (
              <CompetitionList
                competitionData={competitionData}
                filterState={filterState}
                shouldShowRegStatus={filterState.shouldShowRegStatus}
                shouldIncludeCancelled={filterState.shouldIncludeCancelled}
                selectedEvents={filterState.selectedEvents}
                isLoading={competitionsIsFetching}
                hasMoreCompsToLoad={hasMoreCompsToLoad}
              />
            )
          }
        </div>
        {/* Old JS code does a lot of things to id=comeptitions-map, to be included? */}
        <div name="competitions-map">
          {
            filterState.displayMode === 'map'
            && (
              <CompetitionMap
                competitionData={competitionData}
                selectedEvents={filterState.selectedEvents}
                shouldIncludeCancelled={filterState.shouldIncludeCancelled}
              />
            )
          }
        </div>
      </Container>

      {!competitionsIsFetching && hasMoreCompsToLoad && filterState.displayMode === 'list' && <div ref={bottomRef} name="page-bottom" />}
    </Container>
  );
}

export default CompetitionView;
