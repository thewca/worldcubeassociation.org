import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Button, Icon, Form, Container, Dropdown,
} from 'semantic-ui-react';

import I18n from '../../lib/i18n';
import { competitionsApiUrl } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import {
  events, continents, countries, competitionConstants,
} from '../../lib/wca-data.js.erb';

import CompetitionTable from './CompetitionTable';

const COMPETITIONS_API_PAGINATION = 25; // Max number of competitions fetched per query
const EVENT_IDS = Object.values(events.official).map((e) => e.id);

const selectedEventsInitialState = {};
EVENT_IDS.forEach((id) => { selectedEventsInitialState[id] = false; });

function CompetitionFilter() {
  const [selectedEvents, setSelectedEvents] = useState(selectedEventsInitialState);
  const editSelectedEvents = (eventId) => {
    setSelectedEvents((prevSelectedEvents) => ({
      ...prevSelectedEvents,
      [eventId]: !prevSelectedEvents[eventId],
    }));
  };

  const {
    data,
    fetchNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['competitions'],
    queryFn: ({ pageParam = 1 }) => fetchJsonOrError(`${competitionsApiUrl}?page=${pageParam}`),
    getNextPageParam: (lastPage, allPages) => {
      // Assuming the last page has less than the max number of competitions fetched per query
      if (lastPage.data.length < COMPETITIONS_API_PAGINATION) {
        return undefined;
      }

      return allPages.length + 1;
    },
  });

  const { ref, inView } = useInView();
  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  return (
    <Container>
      <h2>{I18n.t('competitions.index.title')}</h2>
      <Form className="competition-select" id="competition-query-form" acceptCharset="UTF-8">
        <Form.Field>
          <label htmlFor="events">
            {` ${I18n.t('competitions.competition_form.events')} `}
            <Button primary size="mini" id="select-all-events">{I18n.t('competitions.index.all_events')}</Button>
            <Button size="mini" id="clear-all-events">{I18n.t('competitions.index.clear')}</Button>
          </label>

          <div id="events">
            {EVENT_IDS.map((eventId) => (
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
                  active={selectedEvents[eventId]}
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
              name="region"
              id="region"
              defaultValue="all"
              scrolling
              upward={false}
              style={{ border: '1px solid #ccc', borderRadius: '4px', height: '35px' }}
            >
              <Dropdown.Menu>
                <Dropdown.Item selected value="all" key="all" text={I18n.t('common.all_regions')} />
                <Dropdown.Header>{I18n.t('common.all_regions')}</Dropdown.Header>
                {Object.values(continents.real).map((continent) => (
                  <Dropdown.Item value={continent.id} key={continent.id} text={continent.name} />
                ))}
                <Dropdown.Divider />
                <Dropdown.Header>{I18n.t('common.country')}</Dropdown.Header>
                {Object.values(countries.real).map((country) => (
                  <Dropdown.Item value={country.id} key={country.id} text={country.name} />
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Form.Field>

          <Form.Field width={6}>
            {/* Search to be implemented in Semantic UI */}
            <label htmlFor="search-field">{I18n.t('competitions.index.search')}</label>
            <div id="search-field">
              <div className="input-group">
                <span className="input-group-addon" data-tooltip={I18n.t('competitions.index.tooltips.search')} data-variation="tiny">
                  <i className="icon search " />
                </span>
                <input type="text" name="search" id="search" className="form-control" />
              </div>
            </div>
          </Form.Field>
        </Form.Group>

        <Form.Group>
          <Form.Field>
            <label htmlFor="state">{I18n.t('competitions.index.state')}</label>
            <Button.Group toggle id="state">
              <Button primary name="state" id="present" value="present">
                <span className="caption">{I18n.t('competitions.index.present')}</span>
              </Button>
              <Button primary name="state" id="recent" value="recent" data-tooltip={I18n.t('competitions.index.tooltips.recent', { count: competitionConstants.competitionRecentDays })} data-variation="tiny">
                <span className="caption">{I18n.t('competitions.index.recent')}</span>
              </Button>
              <Button primary name="state" id="past" value="past">
                <span className="caption">{I18n.t('competitions.index.past')}</span>
                <Dropdown
                  pointing
                  name="year"
                  id="year"
                  defaultValue="all years"
                >
                  <Dropdown.Menu>
                    {/* Implement list of years later along with competition API data */}
                    <Dropdown.Item>All</Dropdown.Item>
                    <Dropdown.Item>2023</Dropdown.Item>
                    <Dropdown.Item>2022</Dropdown.Item>
                    <Dropdown.Item>2021</Dropdown.Item>
                    <Dropdown.Item>2020</Dropdown.Item>
                    <Dropdown.Item>2019</Dropdown.Item>
                    <Dropdown.Item>2018</Dropdown.Item>
                    <Dropdown.Item>2017</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Button>
              <Button primary name="state" id="by_announcement" value="by_announcement" data-tooltip={I18n.t('competitions.index.sort_by_announcement')} data-variation="tiny">
                <span className="caption">{I18n.t('competitions.index.by_announcement')}</span>
              </Button>
              <Button primary name="state" id="custom" value="custom">
                <span className="caption">{I18n.t('competitions.index.custom')}</span>
              </Button>
            </Button.Group>
          </Form.Field>

          <Form.Field>
            <div id="delegate" className="field delegate-selector">
              <label htmlFor="Delegate">{I18n.t('layouts.navigation.delegate')}</label>
              <input type="text" name="delegate" id="delegate" className="wca-autocomplete wca-autocomplete-only_one wca-autocomplete-only_staff_delegates wca-autocomplete-users_search selectized" data-data="[]" tabIndex="-1" style={{ display: 'none' }} />
            </div>
          </Form.Field>
        </Form.Group>

        <Form.Group inline>
          <div id="registration-status" className="registration-status-selector">
            <Form.Checkbox
              label={I18n.t('competitions.index.show_registration_status')}
              name="show_registration_status"
              id="show_registration_status"
            />
          </div>

          <div id="cancelled" className="cancel-selector">
            <Form.Checkbox
              label={I18n.t('competitions.index.show_cancelled')}
              name="show_cancelled"
              id="show_cancelled"
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
          <CompetitionTable competitions={data?.pages.map((p) => p.data).flatMap((d) => d)} title="Competitions" showRegistrationStatus={false} loading={isFetching} />
        </div>
        <div className="col-xs-12 col-md-12">
          <div id="competitions-map" />
        </div>
      </Container>

      {!isFetching && <div ref={ref} name="page-bottom" />}
    </Container>
  );
}

export default CompetitionFilter;
