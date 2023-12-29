import React, { useState, useEffect } from 'react';
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

import CompetitionTable from './CompetitionTable';

import 'react-datepicker/dist/react-datepicker.css';

const COMPETITIONS_API_PAGINATION = 25; // Max number of competitions fetched per query
const WCA_EVENT_IDS = Object.values(events.official).map((e) => e.id);

const PAST_YEARS_WITH_COMPETITIONS = [];
for (let year = new Date().getFullYear(); year >= 2003; year -= 1) {
  PAST_YEARS_WITH_COMPETITIONS.push(year);
}
PAST_YEARS_WITH_COMPETITIONS.push(1982);

const regionsOptions = [
  { key: 'all', text: I18n.t('common.all_regions'), value: 'all' },
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

function CompetitionFilter() {
  const [competitionApiKey, setCompetitionApiKey] = useState({
    sort_by: 'present', year: '', region: '', delegate: '', search: '',
  });
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState();
  const [selectedDelegate, setSelectedDelegate] = useState();
  const [pastSelectedYear, setPastSelectedYear] = useState('all_years');
  const [customStartDate, setCustomStartDate] = useState();
  const [customEndDate, setCustomEndDate] = useState();
  const [showRegistration, setShowRegistration] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [searchQuery, setSearchQuery] = useState();
  const [timeOrder, setTimeOrder] = useState('present');

  const updateCustomCompetitionApiKey = () => {
    setCompetitionApiKey((prevKey) => ({
      ...prevKey,
      sort_by: 'custom',
      year: `start${customStartDate?.toISOString().split('T')[0] || ''}
      end${customEndDate?.toISOString().split('T')[0] || ''}`,
    }));
  };

  const editSelectedEvents = (eventId) => {
    setSelectedEvents((prevSelectedEvents) => (
      prevSelectedEvents.includes(eventId)
        ? prevSelectedEvents.filter((id) => id !== eventId)
        : [...prevSelectedEvents, eventId]
    ));
  };
  const editSelectedRegion = (region) => {
    setSelectedRegion(region === 'all' ? '' : region);
    setCompetitionApiKey((prevKey) => ({
      ...prevKey,
      region: region === 'all' ? '' : region,
    }));
  };
  const editSelectedDelegate = (delegateId) => {
    setSelectedDelegate(delegateId === 'None' ? '' : delegateId);
    setCompetitionApiKey((prevKey) => ({
      ...prevKey,
      delegate: delegateId === 'None' ? '' : delegateId,
    }));
  };
  const editPastSelectedYear = (newYear) => {
    setPastSelectedYear(newYear);
    if (timeOrder === 'past') {
      setCompetitionApiKey((prevKey) => ({ ...prevKey, sort_by: 'past', year: newYear }));
    }
  };
  const editCustomStartDate = (date) => {
    setCustomStartDate(date);
    setCompetitionApiKey((prevKey) => ({
      ...prevKey,
      sort_by: 'custom',
      year: `start${date?.toISOString().split('T')[0] || ''}
      end${customEndDate?.toISOString().split('T')[0] || ''}`,
    }));
  };
  const editCustomEndDate = (date) => {
    setCustomEndDate(date);
    setCompetitionApiKey((prevKey) => ({
      ...prevKey,
      sort_by: 'custom',
      year: `start${customStartDate?.toISOString().split('T')[0] || ''}
      end${date?.toISOString().split('T')[0] || ''}`,
    }));
  };
  const editSearchQuery = (q) => {
    setSearchQuery(q);
    setCompetitionApiKey((prevKey) => ({
      ...prevKey,
      search: q,
    }));
  };
  const editTimeOrder = (order) => {
    if (order === 'past') {
      setCompetitionApiKey((prevKey) => ({ ...prevKey, sort_by: 'past', year: pastSelectedYear }));
    } else if (order === 'custom') {
      // Calling this in a separate function somehow avoids the problem with setState
      // being asynchronous and causing the query key to be strangely changed back and forth
      updateCustomCompetitionApiKey();
    } else {
      setCompetitionApiKey((prevKey) => ({ ...prevKey, sort_by: order, year: '' }));
    }

    setTimeOrder(order);
  };

  const [inProgressComps, setInProgressComps] = useState([]);
  const [notInProgressComps, setNotInProgressComps] = useState([]);
  const [recentComps, setRecentComps] = useState([]);
  const [sortByAnnouncementComps, setSortByAnnouncementComps] = useState([]);
  const [pastComps, setPastComps] = useState({});
  const [customDatesComps, setCustomDatesComps] = useState([]);

  const editPastComps = (comps, year) => {
    setPastComps((prevPastComps) => ({
      ...prevPastComps,
      [year]: comps,
    }));
  };

  const {
    data: competitionsData,
    fetchNextPage: competitionsFetchNextPage,
    isFetching: competitionsIsFetching,
    hasNextPage: hasUnloadedCompetitions,
  } = useInfiniteQuery({
    queryKey: ['competitions', competitionApiKey],
    queryFn: ({ pageParam = 1 }) => {
      const dateNow = new Date(Date.now());
      let searchParams;

      if (timeOrder === 'present') {
        searchParams = new URLSearchParams({
          sort: 'start_date,end_date,name',
          ongoing_and_future: dateNow.toISOString().split('T')[0],
          page: pageParam,
        });
      } else if (timeOrder === 'recent') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(dateNow.getDate() - 30);

        searchParams = new URLSearchParams({
          sort: '-end_date,-start_date,name',
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: dateNow.toISOString().split('T')[0],
          page: pageParam,
        });
      } else if (timeOrder === 'past') {
        if (pastSelectedYear === 'all_years') {
          searchParams = new URLSearchParams({
            sort: '-end_date,-start_date,name',
            end: dateNow.toISOString().split('T')[0],
            page: pageParam,
          });
        } else {
          searchParams = new URLSearchParams({
            sort: '-end_date,-start_date,name',
            start: `${pastSelectedYear}-1-1`,
            end: dateNow.getFullYear() === pastSelectedYear ? dateNow.toISOString().split('T')[0] : `${pastSelectedYear}-12-31`,
            page: pageParam,
          });
        }
      } else if (timeOrder === 'by_announcement') {
        searchParams = new URLSearchParams({
          sort: '-announced_at,name',
          page: pageParam,
        });
      } else if (timeOrder === 'custom') {
        searchParams = new URLSearchParams({
          sort: 'start_date,end_date,name',
          start: customStartDate?.toISOString().split('T')[0] || '',
          end: customEndDate?.toISOString().split('T')[0] || '',
          page: pageParam,
        });
      }

      if (selectedRegion) {
        // Continent IDs begin with underscore
        const regionParam = selectedRegion[0] === '_' ? 'continent' : 'country_iso2';
        searchParams.append(regionParam, selectedRegion);
      }
      if (selectedDelegate) {
        searchParams.append('delegate', selectedDelegate);
      }
      if (searchQuery) {
        searchParams.append('q', searchQuery);
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
    const flatData = competitionsData?.pages
      .map((page) => page.data)
      .flatMap((comp) => comp);

    if (!flatData) return;

    if (timeOrder === 'present') {
      const inProgressData = flatData.filter((comp) => comp.inProgress);
      const notInProgressData = flatData.filter((comp) => !comp.inProgress);
      setInProgressComps(inProgressData);
      setNotInProgressComps(notInProgressData);
    } else if (timeOrder === 'recent') {
      setRecentComps(flatData);
    } else if (timeOrder === 'past') {
      editPastComps(flatData, pastSelectedYear);
    } else if (timeOrder === 'by_announcement') {
      setSortByAnnouncementComps(flatData);
    } else if (timeOrder === 'custom') {
      setCustomDatesComps(flatData);
    }
  }, [competitionsData, timeOrder, pastSelectedYear]);

  const { ref, inView: bottomInView } = useInView();
  useEffect(() => {
    if (bottomInView) {
      competitionsFetchNextPage();
    }
  }, [bottomInView, competitionsFetchNextPage]);

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

  const customTimeSelectionButton = (
    <Button
      primary
      name="state"
      id="custom"
      value="custom"
      onClick={() => editTimeOrder('custom')}
      active={timeOrder === 'custom'}
    >
      <span className="caption">{I18n.t('competitions.index.custom')}</span>
    </Button>
  );

  useEffect(() => {
    const flatData = delegatesData?.pages
      .map((page) => page.data)
      .flatMap((delegate) => delegate);
    setDelegatesInfo(flatData);

    if (delegateHasNextPage) {
      delegateFetchNextPage();
    }
  }, [delegatesData, delegateHasNextPage, delegateFetchNextPage]);

  return (
    <Container>
      <h2>{I18n.t('competitions.index.title')}</h2>
      <Form className="competition-select" id="competition-query-form" acceptCharset="UTF-8">
        <Form.Field>
          <label htmlFor="events">
            {` ${I18n.t('competitions.competition_form.events')} `}
            <Button primary size="mini" id="select-all-events" onClick={() => setSelectedEvents(WCA_EVENT_IDS)}>{I18n.t('competitions.index.all_events')}</Button>
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
              onChange={(event, data) => editSelectedRegion(data.value)}
            />
          </Form.Field>
          <Form.Field width={6}>
            <label htmlFor="search">{I18n.t('competitions.index.search')}</label>
            <Input
              name="search"
              id="search"
              icon="search"
              placeholder={I18n.t('competitions.index.tooltips.search')}
              onChange={(event, data) => editSearchQuery(data.value)}
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
                onClick={() => editTimeOrder('present')}
                active={timeOrder === 'present'}
              >
                <span className="caption">{I18n.t('competitions.index.present')}</span>
              </Button>
              <Button
                primary
                name="state"
                id="recent"
                value="recent"
                onClick={() => editTimeOrder('recent')}
                active={timeOrder === 'recent'}
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
                onClick={() => editTimeOrder('past')}
                active={timeOrder === 'past'}
              >
                <span className="caption">
                  {
                    pastSelectedYear === 'all_years' ? I18n.t('competitions.index.past_all')
                      : I18n.t('competitions.index.past_from', { year: pastSelectedYear })
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
                      onClick={() => editPastSelectedYear('all_years')}
                      active={pastSelectedYear === 'all_years'}
                    >
                      {I18n.t('competitions.index.all_years')}
                    </Dropdown.Item>
                    {PAST_YEARS_WITH_COMPETITIONS.map((year) => (
                      <Dropdown.Item
                        key={`past_select_${year}`}
                        onClick={() => editPastSelectedYear(year)}
                        active={pastSelectedYear === year}
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
                onClick={() => editTimeOrder('by_announcement')}
                active={timeOrder === 'by_announcement'}
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
                      selected={customStartDate}
                      onChange={(date) => editCustomStartDate(date)}
                      maxDate={customEndDate}
                    />
                  </List.Item>
                  <List.Item>
                    <DatePicker
                      name="end-date"
                      showIcon
                      placeholderText={I18n.t('competitions.index.to_date')}
                      selected={customEndDate}
                      onChange={(date) => editCustomEndDate(date)}
                      minDate={customStartDate}
                    />
                  </List.Item>
                </List>
              </Popup>
            </Button.Group>
          </Form.Field>
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
              options={[{ key: 'None', text: I18n.t('competitions.index.no_delegates'), value: 'None' }, ...(delegatesInfo?.filter((item) => item.name !== 'WCA Board').map((delegate) => (
                {
                  key: delegate.id,
                  text: `${delegate.name} (${delegate.wca_id})`,
                  value: delegate.wca_id,
                  image: { avatar: true, src: delegate.avatar?.thumb_url },
                }
              )) || [])]}
              onChange={(event, data) => editSelectedDelegate(data.value)}
            />
          </Form.Field>
        </Form.Group>

        <Form.Group inline>
          <div id="registration-status" className="registration-status-selector">
            <Form.Checkbox
              label={I18n.t('competitions.index.show_registration_status')}
              name="show_registration_status"
              id="show_registration_status"
              onChange={() => { setShowRegistration(!showRegistration); }}
            />
          </div>

          <div id="cancelled" className="cancel-selector">
            <Form.Checkbox
              label={I18n.t('competitions.index.show_cancelled')}
              name="show_cancelled"
              id="show_cancelled"
              onChange={() => { setShowCancelled(!showCancelled); }}
            />
          </div>
        </Form.Group>

        <Form.Group>
          <Button.Group toggle fluid id="display">
            <Button active name="display" id="display-list" value="list">
              <Icon className="icon list ul " />
              {` ${I18n.t('competitions.index.list')} `}
            </Button>
            <Button name="display" id="display-map" value="map">
              <Icon className="icon map marker alternate " />
              {` ${I18n.t('competitions.index.map')} `}
            </Button>
          </Button.Group>
        </Form.Group>
      </Form>

      <Container id="search-results" className="row competitions-list">
        <div id="loading">
          <div className="spinner-wrapper">
            <i className="icon spinner fa-spin fa-5x" />
          </div>
        </div>
        <div id="competitions-list">
          {
            timeOrder === 'present'
            && (
              <>
                <CompetitionTable
                  competitionData={inProgressComps}
                  title={I18n.t('competitions.index.titles.in_progress')}
                  showRegistrationStatus={showRegistration}
                  showCancelled={showCancelled}
                  selectedEvents={selectedEvents}
                  loading={competitionsIsFetching && !notInProgressComps.length}
                  loaded={notInProgressComps.length}
                  renderedAboveAnotherTable
                />
                <CompetitionTable
                  competitionData={notInProgressComps}
                  title={I18n.t('competitions.index.titles.upcoming')}
                  showRegistrationStatus={showRegistration}
                  showCancelled={showCancelled}
                  selectedEvents={selectedEvents}
                  loading={competitionsIsFetching}
                  loaded={!hasUnloadedCompetitions}
                />
              </>
            )
          }
          {
            timeOrder === 'recent'
            && (
              <CompetitionTable
                competitionData={recentComps}
                title={I18n.t('competitions.index.titles.recent', { count: competitionConstants.competitionRecentDays })}
                showRegistrationStatus={showRegistration}
                showCancelled={showCancelled}
                selectedEvents={selectedEvents}
                loading={competitionsIsFetching}
                loaded={!hasUnloadedCompetitions}
              />
            )
          }
          {
            timeOrder === 'past'
            && (
              <CompetitionTable
                competitionData={pastComps[pastSelectedYear]}
                title={pastSelectedYear === 'all_years' ? I18n.t('competitions.index.titles.past_all') : I18n.t('competitions.index.titles.past', { year: pastSelectedYear })}
                showRegistrationStatus={showRegistration}
                showCancelled={showCancelled}
                selectedEvents={selectedEvents}
                loading={competitionsIsFetching}
                loaded={!hasUnloadedCompetitions}
              />
            )
          }
          {
            timeOrder === 'by_announcement'
            && (
              <CompetitionTable
                competitionData={sortByAnnouncementComps}
                title={I18n.t('competitions.index.titles.by_announcement')}
                showRegistrationStatus={showRegistration}
                showCancelled={showCancelled}
                selectedEvents={selectedEvents}
                sortByAnnouncement
                loading={competitionsIsFetching}
                loaded={!hasUnloadedCompetitions}
              />
            )
          }
          {
            timeOrder === 'custom'
            && (
              <CompetitionTable
                competitionData={customDatesComps}
                title={I18n.t('competitions.index.titles.custom')}
                showRegistrationStatus={showRegistration}
                showCancelled={showCancelled}
                selectedEvents={selectedEvents}
                loading={competitionsIsFetching}
                loaded={!hasUnloadedCompetitions}
              />
            )
          }
        </div>
        <div className="col-xs-12 col-md-12">
          <div id="competitions-map" />
        </div>
      </Container>

      {!competitionsIsFetching && hasUnloadedCompetitions && <div ref={ref} name="page-bottom" />}
    </Container>
  );
}

export default CompetitionFilter;
