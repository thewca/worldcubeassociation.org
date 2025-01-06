import React, {
  useEffect, useMemo, useReducer, useState,
} from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Button,
  Container,
  Header,
  Icon,
  Segment,
  Transition,
} from 'semantic-ui-react';

import I18n from '../../lib/i18n';
import { apiV0Urls, WCA_API_PAGINATION } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

import CompetitionsFilters, { ToggleListOrMapDisplay } from './CompetitionsFilters';
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
import { isInProgress, isProbablyOver } from '../../lib/utils/competition-table';

const DEBOUNCE_MS = 600;

function CompetitionsView({ canViewAdminDetails = false }) {
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

  const competitionQueryKey = useMemo(
    () => calculateQueryKey(debouncedFilterState, canViewAdminDetails),
    [debouncedFilterState, canViewAdminDetails],
  );

  // Need to make sure that people don't "hijack" admin mode by manipulating the URL
  const shouldShowAdminDetails = canViewAdminDetails && filterState.shouldShowAdminDetails;

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
      const querySearchParams = createSearchParams(
        debouncedFilterState,
        pageParam,
        canViewAdminDetails,
      );

      return fetchJsonOrError(`${apiV0Urls.competitions.listIndex}?${querySearchParams}`);
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

  const competitions = rawCompetitionData?.pages.flatMap((page) => page.data);

  const [showFilters, setShowFilters] = useState(true);

  return (
    <Container>
      <Header as="h2">
        <Button
          floated="right"
          icon
          labelPosition="left"
          toggle
          // We want to make the button green to invite the user's attention
          //   when the filters are *not* currently shown. When the filters are shown,
          //   the button to disable/hide them should be "not-active-grey" to remove emphasis.
          active={!showFilters}
          onClick={() => setShowFilters((prev) => !prev)}
        >
          <Icon name="filter" />
          {showFilters ? I18n.t('competitions.index.hide_filters') : I18n.t('competitions.index.show_filters')}
        </Button>
        {I18n.t('competitions.index.title')}
      </Header>
      <Transition visible={showFilters} animation="slide down">
        <Segment raised>
          <Button
            floated="right"
            icon
            labelPosition="left"
            size="tiny"
            secondary
            onClick={() => dispatchFilter({ type: 'reset' })}
          >
            <Icon name="repeat" />
            {I18n.t('competitions.index.reset_filters')}
          </Button>
          <CompetitionsFilters
            filterState={filterState}
            dispatchFilter={dispatchFilter}
            shouldShowAdminDetails={shouldShowAdminDetails}
            canViewAdminDetails={canViewAdminDetails}
            displayMode={displayMode}
          />
        </Segment>
      </Transition>

      <ToggleListOrMapDisplay
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      />

      <Segment basic>
        {
          displayMode === 'list'
          && (
            <ListView
              competitions={competitions}
              filterState={debouncedFilterState}
              shouldShowAdminDetails={shouldShowAdminDetails}
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
              isLoading={competitionsIsFetching}
              fetchMoreCompetitions={competitionsFetchNextPage}
              hasMoreCompsToLoad={hasMoreCompsToLoad}
            />
          )
        }
      </Segment>
    </Container>
  );
}

export default CompetitionsView;
