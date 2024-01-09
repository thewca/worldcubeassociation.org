import React, {
  useState, useEffect, useReducer, useMemo,
} from 'react';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Button, Icon, Form, Container, Dropdown, Popup, List, Input, Header,
} from 'semantic-ui-react';
import DatePicker from 'react-datepicker';

import I18n from '../../lib/i18n';
import { competitionsApiUrl, delegatesApiUrl } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import {
  events, continents, countries, competitionConstants,
} from '../../lib/wca-data.js.erb';

import CompetitionList from './CompetitionList';
import CompetitionMap from './CompetitionMap';

import 'react-datepicker/dist/react-datepicker.css';

// Max number of competitions fetched per query
const COMPETITIONS_API_PAGINATION = 25;

// Limit number of markers on map, especially for "All Past Competitions"
const MAP_DISPLAY_LIMIT = 500;

const WCA_EVENT_IDS = Object.values(events.official).map((e) => e.id);

const PAST_YEARS_WITH_COMPETITIONS = [];
for (let year = new Date().getFullYear(); year >= 2003; year -= 1) {
  PAST_YEARS_WITH_COMPETITIONS.push(year);
}
PAST_YEARS_WITH_COMPETITIONS.push(1982);

const regionsOptions = [
  { key: 'all', text: I18n.t('common.all_regions'), value: 'all_regions' },
  {
    key: 'continents_header', value: '', disabled: true, content: <Header content={I18n.t('common.continent')} size="small" style={{ textAlign: 'center' }} />,
  },
  ...(Object.values(continents.real).map((continent) => (
    { key: continent.id, text: continent.name, value: continent.id }
  ))),
  {
    key: 'countries_header', value: '', disabled: true, content: <Header content={I18n.t('common.country')} size="small" style={{ textAlign: 'center' }} />,
  },
  ...(Object.values(countries.real).map((country) => (
    { key: country.id, text: country.name, value: country.iso2 }
  ))),
];

const calculateQueryKey = (filterState) => {
  let timeKey = '';
  if (filterState?.timeOrder === 'past') {
    timeKey = `${filterState.selectedYear}`;
  } else if (filterState?.timeOrder === 'custom') {
    timeKey = `start${filterState.customStartDate}-end${filterState.customEndDate}`;
  }

  return {
    timeOrder: filterState?.timeOrder,
    region: filterState?.region,
    delegate: filterState?.delegate,
    search: filterState?.search,
    time: timeKey,
  };
};

const filterInitialState = {
  timeOrder: 'present',
  selectedYear: 'all_years',
  customStartDate: null,
  customEndDate: null,
  region: 'all_regions',
  delegate: '',
  search: '',
};
const filterReducer = (state, action) => (
  { ...state, ...action }
);

function CompetitionFilters() {
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [shouldShowRegStatus, setShouldShowRegStatus] = useState(false);
  const [shouldShowCancelled, setShouldShowCancelled] = useState(false);
  const [displayMode, setDisplayMode] = useState('list');
  const [competitionData, setCompetitionData] = useState([]);

  const [filterState, dispatchFilter] = useReducer(filterReducer, filterInitialState);
  const competitionQueryKey = useMemo(() => calculateQueryKey(filterState), [filterState]);

  const editSelectedEvents = (eventId) => {
    setSelectedEvents((prevSelectedEvents) => (
      prevSelectedEvents.includes(eventId)
        ? prevSelectedEvents.filter((id) => id !== eventId)
        : [...prevSelectedEvents, eventId]
    ));
  };

  const {
    data: rawCompetitionData,
    fetchNextPage: competitionsFetchNextPage,
    isFetching: competitionsIsFetching,
    hasNextPage: hasMoreCompsToLoad,
  } = useInfiniteQuery({
    queryKey: ['competitions', competitionQueryKey],
    queryFn: ({ pageParam = 1 }) => {
      const dateNow = new Date();
      let searchParams;

      if (filterState.timeOrder === 'present') {
        searchParams = new URLSearchParams({
          sort: 'start_date,end_date,name',
          ongoing_and_future: dateNow.toISOString().split('T')[0],
          page: pageParam,
        });
      } else if (filterState.timeOrder === 'recent') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(dateNow.getDate() - 30);

        searchParams = new URLSearchParams({
          sort: '-end_date,-start_date,name',
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: dateNow.toISOString().split('T')[0],
          page: pageParam,
        });
      } else if (filterState.timeOrder === 'past') {
        if (filterState.selectedYear === 'all_years') {
          searchParams = new URLSearchParams({
            sort: '-end_date,-start_date,name',
            end: dateNow.toISOString().split('T')[0],
            page: pageParam,
          });
        } else {
          searchParams = new URLSearchParams({
            sort: '-end_date,-start_date,name',
            start: `${filterState.selectedYear}-1-1`,
            end: dateNow.getFullYear() === filterState.selectedYear ? dateNow.toISOString().split('T')[0] : `${filterState.selectedYear}-12-31`,
            page: pageParam,
          });
        }
      } else if (filterState.timeOrder === 'by_announcement') {
        searchParams = new URLSearchParams({
          sort: '-announced_at,name',
          page: pageParam,
        });
      } else if (filterState.timeOrder === 'custom') {
        searchParams = new URLSearchParams({
          sort: 'start_date,end_date,name',
          start: filterState.customStartDate?.toISOString().split('T')[0] || '',
          end: filterState.customEndDate?.toISOString().split('T')[0] || '',
          page: pageParam,
        });
      }

      if (filterState.region && filterState.region !== 'all_regions') {
        // Continent IDs begin with underscore
        const regionParam = filterState.region[0] === '_' ? 'continent' : 'country_iso2';
        searchParams.append(regionParam, filterState.region);
      }
      if (filterState.delegate) {
        searchParams.append('delegate', filterState.delegate);
      }
      if (filterState.search) {
        searchParams.append('q', filterState.search);
      }

      return fetchJsonOrError(`${competitionsApiUrl}?${searchParams.toString()}`);
    },
    getNextPageParam: (lastPage, allPages) => {
      // Assuming the last page has less than the max number of competitions fetched per query
      if (lastPage.data.length < COMPETITIONS_API_PAGINATION) {
        return undefined;
      }

      return allPages.length + 1;
    },
  });

  useEffect(() => {
    const flatData = rawCompetitionData?.pages
      .map((page) => page.data)
      .flat();

    if (flatData) {
      setCompetitionData(flatData);
    }
  }, [rawCompetitionData]);

  const { ref, inView: bottomInView } = useInView();
  useEffect(() => {
    if (bottomInView) {
      competitionsFetchNextPage();
    }
  }, [bottomInView, competitionsFetchNextPage]);
  useEffect(() => {
    // FIX: The limit may be surpassed if competitionData is already over the limit in list view
    if (hasMoreCompsToLoad && displayMode === 'map' && competitionData?.length < MAP_DISPLAY_LIMIT) {
      competitionsFetchNextPage();
    }
  }, [rawCompetitionData, displayMode, hasMoreCompsToLoad, competitionData,
    competitionsFetchNextPage]);

  const [delegatesInfo, setDelegatesInfo] = useState([]);
  const {
    data: delegatesData,
    fetchNextPage: delegateFetchNextPage,
    hasNextPage: delegateHasNextPage,
  } = useInfiniteQuery({
    queryKey: ['delegates'],
    queryFn: ({ pageParam = 1 }) => fetchJsonOrError(`${delegatesApiUrl}?page=${pageParam}`),
    getNextPageParam: (lastPage, allPages) => {
      // Assuming the last page has less than the max number of competitions fetched per query
      if (lastPage.data.length < COMPETITIONS_API_PAGINATION) {
        return undefined;
      }

      return allPages.length + 1;
    },
  });
  useEffect(() => {
    const flatData = delegatesData?.pages
      .map((page) => page.data)
      .flatMap((delegate) => delegate);
    setDelegatesInfo(flatData);

    if (delegateHasNextPage) {
      delegateFetchNextPage();
    }
  }, [delegatesData, delegateHasNextPage, delegateFetchNextPage]);

  const customTimeSelectionButton = (
    <Button
      primary
      name="state"
      id="custom"
      value="custom"
      onClick={() => dispatchFilter({ timeOrder: 'custom' })}
      active={filterState.timeOrder === 'custom'}
    >
      <span className="caption">{I18n.t('competitions.index.custom')}</span>
    </Button>
  );

  return (
    <Container>
      <h2>{I18n.t('competitions.index.title')}</h2>
      <Form className="competition-select" id="competition-query-form" acceptCharset="UTF-8">
        <Form.Field>
          <label htmlFor="events">
            {`${I18n.t('competitions.competition_form.events')}`}
            <br />
            <Button primary type="button" size="mini" id="select-all-events" onClick={() => setSelectedEvents(WCA_EVENT_IDS)}>{I18n.t('competitions.index.all_events')}</Button>
            <Button size="mini" id="clear-all-events" onClick={() => setSelectedEvents([])}>{I18n.t('competitions.index.clear')}</Button>
          </label>

          <div id="events">
            {WCA_EVENT_IDS.map((eventId) => (
              <React.Fragment key={eventId}>
                <Button
                  basic
                  icon
                  toggle
                  size="mini"
                  className="event-checkbox"
                  id={`checkbox-${eventId}`}
                  value={eventId}
                  data-tooltip={I18n.t(`events.${eventId}`)}
                  data-variation="tiny"
                  onClick={() => editSelectedEvents(eventId)}
                  active={selectedEvents.includes(eventId)}
                >
                  <Icon className={`cubing-icon event-${eventId}`} />
                </Button>
              </React.Fragment>
            ))}
          </div>
        </Form.Field>

        <Form.Group>
          <Form.Field width={6}>
            <label htmlFor="region">{I18n.t('competitions.index.region')}</label>
            <Dropdown
              search
              selection
              defaultValue="all"
              options={regionsOptions}
              onChange={(_, data) => dispatchFilter({ region: data.value })}
            />
          </Form.Field>
          <Form.Field width={6}>
            <label htmlFor="search">{I18n.t('competitions.index.search')}</label>
            <Input
              name="search"
              id="search"
              icon="search"
              placeholder={I18n.t('competitions.index.tooltips.search')}
              onChange={(_, data) => dispatchFilter({ search: data.value })}
            />
          </Form.Field>
        </Form.Group>

        <Form.Group>
          <Form.Field width={8}>
            <label htmlFor="delegate">{I18n.t('layouts.navigation.delegate')}</label>
            <Dropdown
              name="delegate"
              id="delegate"
              fluid
              search
              deburr
              selection
              defaultValue="None"
              style={{ textAlign: 'center' }}
              options={[{ key: 'None', text: I18n.t('competitions.index.no_delegates'), value: '' }, ...(delegatesInfo?.filter((item) => item.name !== 'WCA Board').map((delegate) => (
                {
                  key: delegate.id,
                  text: `${delegate.name} (${delegate.wca_id})`,
                  value: delegate.wca_id,
                  image: { avatar: true, src: delegate.avatar?.thumb_url },
                }
              )) || [])]}
              onChange={(_, data) => dispatchFilter({ delegate: data.value })}
            />
          </Form.Field>
        </Form.Group>

        <Form.Group>
          <Form.Field>
            <label htmlFor="state">{I18n.t('competitions.index.state')}</label>
            <Button.Group id="state">
              <Button
                primary
                name="state"
                id="present"
                value="present"
                onClick={() => dispatchFilter({ timeOrder: 'present' })}
                active={filterState.timeOrder === 'present'}
              >
                <span className="caption">{I18n.t('competitions.index.present')}</span>
              </Button>
              <Button
                primary
                name="state"
                id="recent"
                value="recent"
                onClick={() => dispatchFilter({ timeOrder: 'recent' })}
                active={filterState.timeOrder === 'recent'}
                data-tooltip={I18n.t('competitions.index.tooltips.recent', { count: competitionConstants.competitionRecentDays })}
                data-variation="tiny"
              >
                <span className="caption">{I18n.t('competitions.index.recent')}</span>
              </Button>
              <Button
                primary
                name="state"
                id="past"
                value="past"
                onClick={() => dispatchFilter({ timeOrder: 'past' })}
                active={filterState.timeOrder === 'past'}
              >
                <span className="caption">
                  {
                    filterState.selectedYear === 'all_years' ? I18n.t('competitions.index.past_all')
                      : I18n.t('competitions.index.past_from', { year: filterState.selectedYear })
                  }
                </span>
                <Dropdown
                  name="year"
                  id="year"
                  pointing
                  scrolling
                  upward={false}
                >
                  <Dropdown.Menu>
                    <Dropdown.Item
                      key="past_select_all_years"
                      onClick={() => dispatchFilter({ timeOrder: 'past', selectedYear: 'all_years' })}
                      active={filterState.selectedYear === 'all_years'}
                    >
                      {I18n.t('competitions.index.all_years')}
                    </Dropdown.Item>
                    {PAST_YEARS_WITH_COMPETITIONS.map((year) => (
                      <Dropdown.Item
                        key={`past_select_${year}`}
                        onClick={() => dispatchFilter({ timeOrder: 'past', selectedYear: year })}
                        active={filterState.selectedYear === year}
                      >
                        {year}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Button>
              <Button
                primary
                name="state"
                id="by_announcement"
                value="by_announcement"
                onClick={() => dispatchFilter({ timeOrder: 'by_announcement' })}
                active={filterState.timeOrder === 'by_announcement'}
                data-tooltip={I18n.t('competitions.index.sort_by_announcement')}
                data-variation="tiny"
              >
                <span className="caption">{I18n.t('competitions.index.by_announcement')}</span>
              </Button>
              <Popup
                on="click"
                position="bottom center"
                pinned
                trigger={customTimeSelectionButton}
              >
                <List>
                  <List.Item>
                    <DatePicker
                      name="start-date"
                      showIcon
                      placeholderText={I18n.t('competitions.index.from_date')}
                      selected={filterState.customStartDate}
                      onChange={(date) => dispatchFilter({ customStartDate: date })}
                      maxDate={filterState.customEndDate}
                    />
                  </List.Item>
                  <List.Item>
                    <DatePicker
                      name="end-date"
                      showIcon
                      placeholderText={I18n.t('competitions.index.to_date')}
                      selected={filterState.customEndDate}
                      onChange={(date) => dispatchFilter({ customEndDate: date })}
                      minDate={filterState.customStartDate}
                    />
                  </List.Item>
                </List>
              </Popup>
            </Button.Group>
          </Form.Field>
        </Form.Group>

        <Form.Group inline>
          <div id="registration-status" className="registration-status-selector">
            <Form.Checkbox
              label={I18n.t('competitions.index.show_registration_status')}
              name="show_registration_status"
              id="show_registration_status"
              onChange={() => { setShouldShowRegStatus(!shouldShowRegStatus); }}
            />
          </div>

          <div id="cancelled" className="cancel-selector">
            <Form.Checkbox
              label={I18n.t('competitions.index.show_cancelled')}
              name="show_cancelled"
              id="show_cancelled"
              onChange={() => { setShouldShowCancelled(!shouldShowCancelled); }}
            />
          </div>
        </Form.Group>

        <Form.Group>
          <Button.Group toggle fluid id="display">
            <Button name="display" id="display-list" active={displayMode === 'list'} onClick={() => setDisplayMode('list')}>
              <Icon className="icon list ul " />
              {` ${I18n.t('competitions.index.list')} `}
            </Button>
            <Button name="display" id="display-map" active={displayMode === 'map'} onClick={() => setDisplayMode('map')}>
              <Icon className="icon map marker alternate " />
              {` ${I18n.t('competitions.index.map')} `}
            </Button>
          </Button.Group>
        </Form.Group>
      </Form>

      <Container id="search-results" className="row competitions-list">
        <div id="competitions-list">
          {
            displayMode === 'list'
            && (
              <CompetitionList
                competitionData={competitionData}
                filterState={filterState}
                shouldShowRegStatus={shouldShowRegStatus}
                shouldShowCancelled={shouldShowCancelled}
                selectedEvents={selectedEvents}
                isLoading={competitionsIsFetching}
                hasMoreCompsToLoad={hasMoreCompsToLoad}
              />
            )
          }
        </div>
        {/* Old JS code does a lot of things to id=comeptitions-map, to be included? */}
        <div name="competitions-map">
          {
            displayMode === 'map'
            && (
              <CompetitionMap
                competitionData={competitionData}
                selectedEvents={selectedEvents}
                shouldShowCancelled={shouldShowCancelled}
              />
            )
          }
        </div>
      </Container>

      {!competitionsIsFetching && hasMoreCompsToLoad && displayMode === 'list' && <div ref={ref} name="page-bottom" />}
    </Container>
  );
}

export default CompetitionFilters;
