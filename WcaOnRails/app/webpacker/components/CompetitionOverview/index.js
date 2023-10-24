import React from 'react';

import I18n from '../../lib/i18n';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { competitionsApiUrl } from '../../lib/requests/routes.js.erb';
import {
  events, continents, countries, competitionConstants,
} from '../../lib/wca-data.js.erb';

import CompetitionTable from './CompetitionTable';

function CompetitionOverview() {
  const { loading, error, data } = useLoadedData(competitionsApiUrl);

  return (
    <div className="container">
      <h2>{I18n.t('competitions.index.title')}</h2>
      <form className="competition-select form-inline list" id="competition-query-form" acceptCharset="UTF-8">

        <div className="form-group">
          <label htmlFor="events">
            {` ${I18n.t('competitions.competition_form.events')} `}
            <button type="button" id="select-all-events" className="btn btn-primary btn-xs">{I18n.t('competitions.index.all_events')}</button>
            <button type="button" id="clear-all-events" className="btn btn-default btn-xs">{I18n.t('competitions.index.clear')}</button>
          </label>

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
        </div>

        <div className="form-group">
          <label htmlFor="region">{I18n.t('competitions.index.region')}</label>

          <select name="region" id="region" className="form-control">
            <option value="all">{I18n.t('common.all_regions')}</option>
            <optgroup label={I18n.t('common.continent')}>
              {Object.values(continents.real).map((continent) => (
                <option value={continent.id} key={continent.id}>{continent.name}</option>
              ))}
            </optgroup>
            <optgroup label={I18n.t('common.country')}>
              {Object.values(countries.real).map((country) => (
                <option value={country.id} key={country.id}>{country.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="search-field">{I18n.t('competitions.index.search')}</label>
          <div id="search-field">
            <div className="input-group">
              <span className="input-group-addon" data-toggle="tooltip" data-placement="top" title={I18n.t('competitions.index.tooltips.search')}>
                <i className="icon search " />
              </span>
              <input type="text" name="search" id="search" className="form-control" />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="state">{I18n.t('competitions.index.state')}</label>
          <div id="state" className="btn-group" data-toggle="buttons">
            <label id="present" className="btn btn-primary" htmlFor="state_present">
              <input type="radio" name="state" id="state_present" value="present" />
              <span className="caption">{I18n.t('competitions.index.present')}</span>
            </label>

            <label id="recent" className="btn btn-primary" data-toggle="tooltip" title={I18n.t('competitions.index.tooltips.recent', { count: competitionConstants.competitionRecentDays })} htmlFor="state_recent">
              <input type="radio" name="state" id="state_recent" value="recent" />
              <span className="caption">{I18n.t('competitions.index.recent')}</span>
            </label>

            <ul className="dropdown-menu years">
              <input type="hidden" name="year" id="year" value="all years" autoComplete="off" />
              {/* Implement list of years later along with competition API data */}
            </ul>
            <label id="past" className="btn btn-primary" data-toggle="drop-down" htmlFor="state_past">
              <input type="radio" name="state" id="state_past" value="past" />
              <span className="caption">{I18n.t('competitions.index.past')}</span>
            </label>

            <label id="by_announcement" className="btn btn-primary" data-toggle="tooltip" title={I18n.t('competitions.index.sort_by_announcement')} htmlFor="state_by_announcement">
              <input type="radio" name="state" id="state_by_announcement" value="by_announcement" />
              <span className="caption">{I18n.t('competitions.index.by_announcement')}</span>
            </label>

            <label id="custom" className="btn btn-primary" htmlFor="state_custom">
              <input type="radio" name="state" id="state_custom" value="custom" />
              <span className="caption">{I18n.t('competitions.index.custom')}</span>
            </label>
          </div>
        </div>

        <div id="delegate" className="form-group delegate-selector">
          <label htmlFor="Delegate">{I18n.t('layouts.navigation.delegate')}</label>
          <input type="text" name="delegate" id="delegate" className="wca-autocomplete wca-autocomplete-only_one wca-autocomplete-only_staff_delegates wca-autocomplete-users_search selectized" data-data="[]" tabIndex="-1" style={{ display: 'none' }} />
        </div>

        <div id="registration-status" className="form-group registration-status-selector">
          <input type="checkbox" name="show_registration_status" id="show_registration_status" />
          <label htmlFor="show_registration_status">{I18n.t('competitions.index.show_registration_status')}</label>
        </div>

        <div id="cancelled" className="form-group cancel-selector">
          <input type="checkbox" name="show_cancelled" id="show_cancelled" />
          <label htmlFor="show_cancelled">{I18n.t('competitions.index.show_cancelled')}</label>
        </div>

        <div id="display" className="form-group">
          <div className="btn-group btn-group-justified" data-toggle="buttons">
            <label id="display-list" className="btn btn-info active" htmlFor="display_list">
              <input type="radio" name="display" id="display_list" value="list" />
              <i className="icon list ul " />
              {` ${I18n.t('competitions.index.list')} `}
            </label>
            <label id="display-map" className="btn btn-info" htmlFor="display_map">
              <input type="radio" name="display" id="display_map" value="map" />
              <i className="icon map marker alternate " />
              {` ${I18n.t('competitions.index.map')} `}
            </label>
          </div>
        </div>
      </form>

      <div id="search-results" className="row competitions-list">
        <div id="loading">
          <div className="spinner-wrapper">
            <i className="icon spinner fa-spin fa-5x" />
          </div>
        </div>
        <div id="competitions-list">
          {(!loading && !error) && <CompetitionTable competitions={data} title="Competitions" showRegistrationStatus={false} />}
        </div>
        <div className="col-xs-12 col-md-12">
          <div id="competitions-map" />
        </div>
      </div>
    </div>
  );
}

export default CompetitionOverview;
