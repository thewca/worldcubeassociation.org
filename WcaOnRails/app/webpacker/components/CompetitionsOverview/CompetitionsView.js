import React, {
  useEffect, useMemo, useReducer, useState,
} from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Container } from 'semantic-ui-react';

import I18n from '../../lib/i18n';
import { apiV0Urls, WCA_API_PAGINATION } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

import CompetitionsFilters from './CompetitionsFilters';
import ListView from './ListView';
import MapView from './MapView';
import {
  createFilterState,
  filterReducer,
  getDisplayMode,
  updateSearchParams,
} from './filterUtils';
import { calculateQueryKey, createSearchParams } from './queryUtils';
import useDebounce from '../../lib/hooks/useDebounce';
import { isCancelled, isInProgress, isProbablyOver } from '../../lib/utils/competition-table';

const DEBOUNCE_MS = 600;

function CompetitionsView() {
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const [filterState, dispatchFilter] = useReducer(
    filterReducer,
    searchParams,
    createFilterState,
  );
  const debouncedFilterState = useDebounce(filterState, DEBOUNCE_MS);
  const [displayMode, setDisplayMode] = useState(() => getDisplayMode(searchParams));
  const [shouldShowRegStatus, setShouldShowRegStatus] = useState(false);
  const competitionQueryKey = useMemo(
    () => calculateQueryKey(debouncedFilterState),
    [debouncedFilterState],
  );

  useEffect(
    () => updateSearchParams(searchParams, filterState, displayMode),
    [searchParams, filterState, displayMode],
  );

  const {
    data: rawCompetitionData,
    fetchNextPage: competitionsFetchNextPage,
    isFetching: competitionsIsFetching,
    hasNextPage: hasMoreCompsToLoad,
  } = useInfiniteQuery({
    queryKey: ['competitions', competitionQueryKey],
    queryFn: ({ pageParam = 1 }) => {
      const querySearchParams = createSearchParams(debouncedFilterState, pageParam);
      return fetchJsonOrError(`${apiV0Urls.competitions.list}?${querySearchParams}`);
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

  const competitions = rawCompetitionData?.pages.flatMap((page) => page.data)
    .filter((comp) => (
      (!isCancelled(comp) || debouncedFilterState.shouldIncludeCancelled)
      && (debouncedFilterState.selectedEvents.every((event) => comp.event_ids.includes(event)))
    ));

  return (
    <Container>
      <h2>{I18n.t('competitions.index.title')}</h2>
      <CompetitionsFilters
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
            <ListView
              competitions={competitions}
              filterState={debouncedFilterState}
              shouldShowRegStatus={shouldShowRegStatus}
              isLoading={competitionsIsFetching}
              fetchMoreCompetitions={competitionsFetchNextPage}
              hasMoreCompsToLoad={hasMoreCompsToLoad}
            />
          )
        }
        {
          displayMode === 'map'
          && (
            <MapView
              competitions={
                debouncedFilterState.timeOrder === 'present'
                  ? competitions?.filter((comp) => (
                    !isInProgress(comp) && !isProbablyOver(comp)
                  ))
                  : competitions
              }
              fetchMoreCompetitions={competitionsFetchNextPage}
              hasMoreCompsToLoad={hasMoreCompsToLoad}
            />
          )
        }
      </Container>
    </Container>
  );
}

export default CompetitionsView;
