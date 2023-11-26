import React from 'react';
import {
  Button, Icon, Form, Container, Dropdown,
} from 'semantic-ui-react';

import I18n from '../../lib/i18n';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import { competitionsApiUrl } from '../../lib/requests/routes.js.erb';
import {
  events, continents, countries,
} from '../../lib/wca-data.js.erb';

import CompetitionTable from './CompetitionTable';

function CompetitionList() {
  const { loading, error, data } = useLoadedData(`${competitionsApiUrl}?page=19`);

  if (loading) return <Loading />;
  if (error) return <Errored />;
  return <CompetitionTable competitions={data} title="Competitions" showRegistrationStatus={false} />;
}

function CompetitionOverview() {
  return (
    <div className="container">
      <h2>{I18n.t('competitions.index.title')}</h2>
      <Form className="competition-select" id="competition-query-form" acceptCharset="UTF-8">
        <Form.Field>
          <label htmlFor="events">
            {` ${I18n.t('competitions.competition_form.events')} `}
          </label>

          <Button primary size="mini" id="select-all-events">{I18n.t('competitions.index.all_events')}</Button>
          <Button size="mini" id="clear-all-events">{I18n.t('competitions.index.clear')}</Button>

          <div id="events">
            {Object.values(events.official).map((event) => (
              <React.Fragment key={event.id}>
                <span className="event-checkbox">
                  <label htmlFor={`checkbox-${event.id}`}>
                    <input type="checkbox" name="event_ids[]" id={`checkbox-${event.id}`} value={event.id} />
                    <i data-toggle="tooltip" data-placement="top" className={` cubing-icon icon event-${event.id}`} data-original-title={event.name} />
                  </label>
                </span>
              </React.Fragment>
            ))}
          </div>
        </Form.Field>

        <Form.Group>
          <Form.Field width={6}>
            <label htmlFor="region">{I18n.t('competitions.index.region')}</label>
            <Dropdown
              selection
              name="region"
              id="region"
              defaultValue="all"
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
            <label htmlFor="search-field">{I18n.t('competitions.index.search')}</label>
            <div id="search-field">
              <div className="input-group">
                <span className="input-group-addon" data-toggle="tooltip" data-placement="top" title={I18n.t('competitions.index.tooltips.search')}>
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
              <Button primary name="state" id="recent" value="recent">
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
              <Button primary name="state" id="by_announcement" value="by_announcement">
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
          <CompetitionList />
        </div>
        <div className="col-xs-12 col-md-12">
          <div id="competitions-map" />
        </div>
      </Container>
    </div>
  );
}

export default CompetitionOverview;
