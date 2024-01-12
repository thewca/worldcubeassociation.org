import React, {
  useEffect, useReducer, useMemo, useState,
} from 'react';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Container } from 'semantic-ui-react';

import I18n from '../../lib/i18n';
import { apiV0Urls, WCA_API_PAGINATION } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

import CompetitionFilters from './CompetitionFilters';
import CompetitionList from './CompetitionList';
import CompetitionMap from './CompetitionMap';
import { filterReducer, filterInitialState } from './filterUtils';
import { calculateQueryKey, createSearchParams } from './queryUtils';

function CompetitionView() {
  const [filterState, dispatchFilter] = useReducer(filterReducer, filterInitialState);
  const [displayMode, setDisplayMode] = useState('list');
  const [shouldShowRegStatus, setShouldShowRegStatus] = useState(false);
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
      return fetchJsonOrError(`${apiV0Urls.competitions.list}?${searchParams}`);
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

  return (
    <Container>
      <h2>{I18n.t('competitions.index.title')}</h2>
      <CompetitionFilters
        filterState={filterState}
        dispatchFilter={dispatchFilter}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        shouldShowRegStatus={shouldShowRegStatus}
        setShouldShowRegStatus={setShouldShowRegStatus}
      />

      <Container id="search-results" className="row competitions-list">
        {
          displayMode === 'list'
          && (
            <CompetitionList
              competitionData={competitionData}
              filterState={filterState}
              shouldShowRegStatus={shouldShowRegStatus}
              isLoading={competitionsIsFetching}
              hasMoreCompsToLoad={hasMoreCompsToLoad}
            />
          )
        }
        {/* Old JS code does a lot of things to id=comeptitions-map, to be included? */}
        {
          displayMode === 'map'
          && (
            <CompetitionMap
              competitionData={competitionData}
              selectedEvents={filterState.selectedEvents}
              shouldIncludeCancelled={filterState.shouldIncludeCancelled}
              fetchMoreCompetitions={competitionsFetchNextPage}
              hasMoreCompsToLoad={hasMoreCompsToLoad}
            />
          )
        }
      </Container>

      {!competitionsIsFetching && hasMoreCompsToLoad && displayMode === 'list' && <div ref={bottomRef} name="page-bottom" />}
    </Container>
  );
}

export default CompetitionView;
