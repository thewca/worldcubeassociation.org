import React from 'react';
import {
  Button, Icon, Form, Dropdown, Popup, List, Input, Header,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import I18n from '../../lib/i18n';
import {
  events, continents, countries, competitionConstants,
} from '../../lib/wca-data.js.erb';

import useDelegatesData from './useDelegatesData';

const WCA_EVENT_IDS = Object.values(events.official).map((e) => e.id);
const PAST_YEARS_WITH_COMPETITIONS = [];
for (let { year } = DateTime.now(); year >= 2003; year -= 1) {
  PAST_YEARS_WITH_COMPETITIONS.push(year);
}
PAST_YEARS_WITH_COMPETITIONS.push(1982);

function CompetitionsFilters({
  filterState,
  dispatchFilter,
  displayMode,
  setDisplayMode,
  shouldShowRegStatus,
  setShouldShowRegStatus,
}) {
  return (
    <Form className="competition-select" id="competition-query-form" acceptCharset="UTF-8">
      <Form.Field>
        <EventSelector
          selectedEvents={filterState.selectedEvents}
          dispatchFilter={dispatchFilter}
        />
      </Form.Field>

      <Form.Group>
        <Form.Field width={6}>
          <RegionSelector dispatchFilter={dispatchFilter} />
        </Form.Field>
        <Form.Field width={6}>
          <SearchBar dispatchFilter={dispatchFilter} />
        </Form.Field>
      </Form.Group>

      <Form.Group>
        <Form.Field width={8}>
          <DelegateSelector dispatchFilter={dispatchFilter} />
        </Form.Field>
      </Form.Group>

      <Form.Group>
        <Form.Field>
          <TimeOrderButtonGroup filterState={filterState} dispatchFilter={dispatchFilter} />
        </Form.Field>
      </Form.Group>

      <Form.Group inline>
        <CompDisplayCheckboxes
          shouldIncludeCancelled={filterState.shouldIncludeCancelled}
          dispatchFilter={dispatchFilter}
          shouldShowRegStatus={shouldShowRegStatus}
          setShouldShowRegStatus={setShouldShowRegStatus}
        />
      </Form.Group>

      <Form.Group>
        <ToggleListOrMapDisplay
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
        />
      </Form.Group>
    </Form>
  );
}

function EventSelector({ selectedEvents, dispatchFilter }) {
  return (
    <>
      <label htmlFor="events">
        {`${I18n.t('competitions.competition_form.events')}`}
        <br />
        <Button primary type="button" size="mini" id="select-all-events" onClick={() => dispatchFilter({ type: 'select_all_events' })}>{I18n.t('competitions.index.all_events')}</Button>
        <Button type="button" size="mini" id="clear-all-events" onClick={() => dispatchFilter({ type: 'clear_events' })}>{I18n.t('competitions.index.clear')}</Button>
      </label>

      <div id="events">
        {WCA_EVENT_IDS.map((eventId) => (
          <React.Fragment key={eventId}>
            <Button
              basic
              icon
              toggle
              type="button"
              size="mini"
              className="event-checkbox"
              id={`checkbox-${eventId}`}
              value={eventId}
              data-tooltip={I18n.t(`events.${eventId}`)}
              data-variation="tiny"
              onClick={() => dispatchFilter({ type: 'toggle_event', eventId })}
              active={selectedEvents.includes(eventId)}
            >
              <Icon className={`cubing-icon event-${eventId}`} />
            </Button>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

function RegionSelector({ dispatchFilter }) {
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

  return (
    <>
      <label htmlFor="region">{I18n.t('competitions.index.region')}</label>
      <Dropdown
        search
        selection
        defaultValue="all"
        options={regionsOptions}
        onChange={(_, data) => dispatchFilter({ region: data.value })}
      />
    </>
  );
}

function SearchBar({ dispatchFilter }) {
  return (
    <>
      <label htmlFor="search">{I18n.t('competitions.index.search')}</label>
      <Input
        name="search"
        id="search"
        icon="search"
        placeholder={I18n.t('competitions.index.tooltips.search')}
        onChange={(_, data) => dispatchFilter({ search: data.value })}
      />
    </>
  );
}

function DelegateSelector({ dispatchFilter }) {
  const delegatesData = useDelegatesData();

  return (
    <>
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
        options={[{ key: 'None', text: I18n.t('competitions.index.no_delegates'), value: '' }, ...(delegatesData?.filter((item) => item.name !== 'WCA Board').map((delegate) => (
          {
            key: delegate.id,
            text: `${delegate.name} (${delegate.wca_id})`,
            value: delegate.wca_id,
            image: { avatar: true, src: delegate.avatar?.thumb_url, style: { width: '28px', height: '28px' } },
          }
        )) || [])]}
        onChange={(_, data) => dispatchFilter({ delegate: data.value })}
      />
    </>
  );
}

function TimeOrderButtonGroup({ filterState, dispatchFilter }) {
  return (
    <>
      <label htmlFor="state">{I18n.t('competitions.index.state')}</label>
      <Button.Group id="state">

        <Button
          primary
          type="button"
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
          type="button"
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

        <PastCompYearSelector filterState={filterState} dispatchFilter={dispatchFilter} />

        <Button
          primary
          type="button"
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

        <CustomDateSelector filterState={filterState} dispatchFilter={dispatchFilter} />

      </Button.Group>
    </>
  );
}

function PastCompYearSelector({ filterState, dispatchFilter }) {
  return (
    <Button
      primary
      type="button"
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
  );
}

function CustomDateSelector({ filterState, dispatchFilter }) {
  const customTimeSelectionButton = (
    <Button
      primary
      type="button"
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
  );
}

function CompDisplayCheckboxes({
  shouldIncludeCancelled, dispatchFilter, shouldShowRegStatus, setShouldShowRegStatus,
}) {
  return (
    <>
      <div id="registration-status" className="registration-status-selector">
        <Form.Checkbox
          label={I18n.t('competitions.index.show_registration_status')}
          name="show_registration_status"
          id="show_registration_status"
          onChange={() => setShouldShowRegStatus(!shouldShowRegStatus)}
        />
      </div>

      <div id="cancelled" className="cancel-selector">
        <Form.Checkbox
          label={I18n.t('competitions.index.show_cancelled')}
          name="show_cancelled"
          id="show_cancelled"
          onChange={() => dispatchFilter(
            { shouldIncludeCancelled: !shouldIncludeCancelled },
          )}
        />
      </div>
    </>
  );
}

function ToggleListOrMapDisplay({ displayMode, setDisplayMode }) {
  return (
    <Button.Group toggle fluid id="display">
      <Button type="button" name="display" id="display-list" active={displayMode === 'list'} onClick={() => setDisplayMode('list')}>
        <Icon className="icon list ul " />
        {` ${I18n.t('competitions.index.list')} `}
      </Button>
      <Button type="button" name="display" id="display-map" active={displayMode === 'map'} onClick={() => setDisplayMode('map')}>
        <Icon className="icon map marker alternate " />
        {` ${I18n.t('competitions.index.map')} `}
      </Button>
    </Button.Group>
  );
}

export default CompetitionsFilters;
