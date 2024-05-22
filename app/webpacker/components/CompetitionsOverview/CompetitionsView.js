import React, {
  useEffect, useMemo, useReducer, useState,
} from 'react';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Container, Header } from 'semantic-ui-react';

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

function CompetitionsView({ canViewAdminData = false }) {
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
  const [shouldShowAdminData, setShouldShowAdminData] = useState(false);
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

  const baseCompetitions = rawCompetitionData?.pages.flatMap((page) => page.data)
    .filter((comp) => (
      (!isCancelled(comp) || debouncedFilterState.shouldIncludeCancelled)
      && (debouncedFilterState.selectedEvents.every((event) => comp.event_ids.includes(event)))
    ));

  const compIds = baseCompetitions?.map((comp) => comp.id) || [];

  const {
    data: compRegistrationData,
    isFetching: regDataIsPending,
  } = useQuery({
    queryFn: () => fetchJsonOrError(apiV0Urls.competitions.registrationData, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ ids: compIds }),
    }),
    queryKey: ['registration-info', ...compIds],
    enabled: shouldShowRegStatus && compIds.length > 0,
    // This is where the magic happens: Using `keepPreviousData` makes it so that
    //   all previously loaded indicators are held in-cache while the fetcher for the next
    //   batch is running in the background. (Adding comment here because it's not in the docs)
    placeholderData: keepPreviousData,
    select: (data) => data.data,
  });

  const competitions = useMemo(() => (shouldShowRegStatus ? (
    baseCompetitions?.map((comp) => {
      const regData = compRegistrationData?.find((reg) => reg.id === comp.id);
      return regData ? { ...comp, ...regData } : comp;
    })
  ) : baseCompetitions), [baseCompetitions, compRegistrationData, shouldShowRegStatus]);

  return (
    <Container>
      <Header as="h2">{I18n.t('competitions.index.title')}</Header>
      <CompetitionsFilters
        filterState={filterState}
        dispatchFilter={dispatchFilter}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        shouldShowRegStatus={shouldShowRegStatus}
        setShouldShowRegStatus={setShouldShowRegStatus}
        shouldShowAdminData={shouldShowAdminData}
        setShouldShowAdminData={setShouldShowAdminData}
        canViewAdminData={canViewAdminData}
      />

      <Container fluid>
        {
          displayMode === 'list'
          && (
            <ListView
              competitions={competitions}
              filterState={debouncedFilterState}
              shouldShowRegStatus={shouldShowRegStatus}
              isLoading={competitionsIsFetching}
              regStatusLoading={regDataIsPending}
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
