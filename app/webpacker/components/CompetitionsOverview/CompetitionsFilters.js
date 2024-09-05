import React from 'react';
import {
  Button, Icon, Form, Dropdown, Popup, List, Input, Header,
} from 'semantic-ui-react';
import PulseLoader from 'react-spinners/PulseLoader';

import I18n from '../../lib/i18n';
import {
  events, continents, countries, competitionConstants, nonFutureCompetitionYears,
} from '../../lib/wca-data.js.erb';

import useDelegatesData from './useDelegatesData';
import UtcDatePicker from '../wca/UtcDatePicker';

export const WCA_EVENT_IDS = Object.values(events.official).map((e) => e.id);

function CompetitionsFilters({
  filterState,
  dispatchFilter,
  displayMode,
  setDisplayMode,
  shouldShowRegStatus,
  setShouldShowRegStatus,
  shouldShowAdminDetails,
  canViewAdminDetails,
}) {
  return (
    <Form className="competition-select" id="competition-query-form" acceptCharset="UTF-8">
      <Form.Field>
        <EventSelector
          selectedEvents={filterState.selectedEvents}
          onEventSelection={dispatchFilter}
        />
      </Form.Field>

      <Form.Group>
        <Form.Field width={6}>
          <RegionSelector region={filterState.region} dispatchFilter={dispatchFilter} />
        </Form.Field>
        <Form.Field width={6}>
          <SearchBar text={filterState.search} dispatchFilter={dispatchFilter} />
        </Form.Field>
      </Form.Group>

      <Form.Group>
        <Form.Field width={8}>
          <DelegateSelector delegateId={filterState.delegate} dispatchFilter={dispatchFilter} />
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
          shouldShowAdminDetails={shouldShowAdminDetails}
          canViewAdminDetails={canViewAdminDetails}
          displayMode={displayMode}
        />
      </Form.Group>

      {canViewAdminDetails && shouldShowAdminDetails && (
        <Form.Group>
          <Form.Field>
            <AdminStatusButtonGroup filterState={filterState} dispatchFilter={dispatchFilter} />
          </Form.Field>
        </Form.Group>
      )}

      <Form.Group>
        <ResetFilters dispatchFilter={dispatchFilter} />
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

export function EventSelector({
  selectedEvents,
  onEventSelection,
  eventList = WCA_EVENT_IDS,
  disabled = false,
  maxEvents = Infinity,
  shouldErrorOnEmpty = false,
  eventsDisabled = [],
  disabledText = (event) => {},
}) {
  return (
    <>
      <label htmlFor="events">
        {`${I18n.t('competitions.competition_form.events')}`}
        <br />
        <Popup
          disabled={!Number.isFinite(maxEvents)}
          trigger={
            <span><Button disabled={disabled || eventList.length >= maxEvents} primary type="button" size="mini" id="select-all-events" onClick={() => onEventSelection({ type: 'select_all_events' })}>{I18n.t('competitions.index.all_events')}</Button></span>
        }
        >
          {I18n.t('competitions.registration_v2.register.event_limit', {
            max_events: maxEvents,
          })}
        </Popup>
        <Button disabled={disabled} type="button" size="mini" id="clear-all-events" onClick={() => onEventSelection({ type: 'clear_events' })}>{I18n.t('competitions.index.clear')}</Button>
      </label>
      <Popup
        open={selectedEvents.length === 0}
        disabled={!shouldErrorOnEmpty}
        position="bottom left"
        style={{ color: '#9f3a38' }}
        trigger={(
          <div id="events">
            {eventList.map((eventId) => (
              <Popup
                key={eventId}
                disabled={selectedEvents.length === 0}
                trigger={(
                  <span>
                    {/* Wrap in span so hover works on disabled buttons */}
                    <Button
                      key={eventId}
                      disabled={
                      disabled
                        || (!selectedEvents.includes(eventId) && selectedEvents.length >= maxEvents)
                        || eventsDisabled.includes(eventId)
                    }
                      basic
                      icon
                      toggle
                      type="button"
                      size="mini"
                      className="event-checkbox"
                      id={`checkbox-${eventId}`}
                      value={eventId}
                      data-variation="tiny"
                      onClick={() => onEventSelection({ type: 'toggle_event', eventId })}
                      active={selectedEvents.includes(eventId)}
                    >
                      <Icon className={`cubing-icon event-${eventId}`} style={eventsDisabled.includes(eventId) ? { color: '#FFBBBB' } : {}} />
                    </Button>
                  </span>
)}
              >
                {eventsDisabled.includes(eventId) ? disabledText(eventId) : I18n.t(`events.${eventId}`)}
              </Popup>
            ))}
          </div>
)}
      >
        {I18n.t('registrations.errors.must_register')}
      </Popup>
    </>
  );
}

function RegionSelector({ region, dispatchFilter }) {
  const regionsOptions = [
    { key: 'all', text: I18n.t('common.all_regions'), value: 'all' },
    {
      key: 'continents_header',
      value: '',
      disabled: true,
      content: <Header content={I18n.t('common.continent')} size="small" style={{ textAlign: 'center' }} />,
    },
    ...(Object.values(continents.real).map((continent) => (
      { key: continent.id, text: continent.name, value: continent.id }
    ))),
    {
      key: 'countries_header',
      value: '',
      disabled: true,
      content: <Header content={I18n.t('common.country')} size="small" style={{ textAlign: 'center' }} />,
    },
    ...(Object.values(countries.real).map((country) => (
      {
        key: country.id, text: country.name, value: country.iso2, flag: country.iso2.toLowerCase(),
      }
    ))),
  ];

  return (
    <>
      <label htmlFor="region">{I18n.t('competitions.index.region')}</label>
      <Dropdown
        search
        selection
        clearable
        value={region}
        options={regionsOptions}
        onChange={(_, data) => dispatchFilter({ region: data.value })}
      />
    </>
  );
}

function SearchBar({ text, dispatchFilter }) {
  return (
    <>
      <label htmlFor="search">{I18n.t('competitions.index.search')}</label>
      <Input
        name="search"
        id="search"
        icon="search"
        placeholder={I18n.t('competitions.index.tooltips.search')}
        value={text}
        onChange={(_, data) => dispatchFilter({ search: data.value })}
      />
    </>
  );
}

function DelegateSelector({ delegateId, dispatchFilter }) {
  const { delegatesLoading, delegatesData } = useDelegatesData();

  return (
    <>
      <div style={{ display: 'inline-block' }}>
        <label htmlFor="delegate">{I18n.t('layouts.navigation.delegate')}</label>
        {delegatesLoading && <PulseLoader size="10px" cssOverride={{ marginLeft: '5px' }} />}
      </div>
      <Dropdown
        name="delegate"
        id="delegate"
        fluid
        search
        deburr
        selection
        error={
          !delegatesLoading && delegateId && delegatesData.every(({ id }) => id !== delegateId)
        }
        style={{ textAlign: 'center' }}
        options={[{ key: 'None', text: I18n.t('competitions.index.no_delegates'), value: '' }, ...(delegatesData?.filter((item) => item.name !== 'WCA Board').map((delegate) => (
          {
            key: delegate.id,
            text: `${delegate.name} (${delegate.wca_id})`,
            value: delegate.id,
            image: { avatar: true, src: delegate.thumb_url, style: { width: '28px', height: '28px' } },
          }
        )) || [])]}
        value={delegateId}
        onChange={(_, data) => dispatchFilter({ delegate: data.value })}
        noResultsMessage={delegatesLoading ? I18n.t('competitions.index.delegates_loading') : I18n.t('competitions.index.no_delegates_found')}
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

function AdminStatusButtonGroup({ filterState, dispatchFilter }) {
  return (
    <>
      <label htmlFor="admin-status">{I18n.t('competitions.index.admin_status')}</label>
      <Button.Group id="admin-status">

        <Button
          primary
          type="button"
          name="admin-status"
          id="all"
          value="all"
          onClick={() => dispatchFilter({ adminStatus: 'all' })}
          active={filterState.adminStatus === 'all'}
        >
          <span className="caption">{I18n.t('competitions.index.status_flags.all')}</span>
        </Button>

        <Button
          color="yellow"
          type="button"
          name="admin-status"
          id="warning"
          value="warning"
          onClick={() => dispatchFilter({ adminStatus: 'warning' })}
          active={filterState.adminStatus === 'warning'}
        >
          <span className="caption">{I18n.t('competitions.index.status_flags.warning')}</span>
        </Button>

        <Button
          negative
          type="button"
          name="admin-status"
          id="danger"
          value="danger"
          onClick={() => dispatchFilter({ adminStatus: 'danger' })}
          active={filterState.adminStatus === 'danger'}
        >
          <span className="caption">{I18n.t('competitions.index.status_flags.danger')}</span>
        </Button>

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
          {nonFutureCompetitionYears.map((year) => (
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
          <UtcDatePicker
            name="start-date"
            showIcon
            placeholderText={I18n.t('competitions.index.from_date')}
            isoDate={filterState.customStartDate}
            onChange={(date) => dispatchFilter({ customStartDate: date })}
            selectsStart
            isoStartDate={filterState.customStartDate}
            isoEndDate={filterState.customEndDate}
          />
        </List.Item>
        <List.Item>
          <UtcDatePicker
            name="end-date"
            showIcon
            placeholderText={I18n.t('competitions.index.to_date')}
            isoDate={filterState.customEndDate}
            onChange={(date) => dispatchFilter({ customEndDate: date })}
            selectsEnd
            isoStartDate={filterState.customStartDate}
            isoEndDate={filterState.customEndDate}
            minDate={filterState.customStartDate}
          />
        </List.Item>
      </List>
    </Popup>
  );
}

function CompDisplayCheckboxes({
  shouldIncludeCancelled,
  dispatchFilter,
  shouldShowRegStatus,
  setShouldShowRegStatus,
  shouldShowAdminDetails,
  canViewAdminDetails,
  displayMode,
}) {
  return (
    <>
      <div id="cancelled" className="cancel-selector">
        <Form.Checkbox
          label={I18n.t('competitions.index.show_cancelled')}
          name="show_cancelled"
          id="show_cancelled"
          checked={shouldIncludeCancelled}
          onChange={() => dispatchFilter(
            { shouldIncludeCancelled: !shouldIncludeCancelled },
          )}
        />
      </div>

      {
        displayMode === 'list' && (
          <>
            <div id="registration-status" className="registration-status-selector">
              <Form.Checkbox
                label={I18n.t('competitions.index.show_registration_status')}
                name="show_registration_status"
                id="show_registration_status"
                checked={shouldShowRegStatus}
                onChange={() => setShouldShowRegStatus(!shouldShowRegStatus)}
              />
            </div>
            {canViewAdminDetails && (
              <div id="admin-data" className="admin-data-selector">
                <Form.Checkbox
                  toggle
                  label={I18n.t('competitions.index.use_admin_view')}
                  name="show_admin_data"
                  id="show_admin_data"
                  checked={shouldShowAdminDetails}
                  onChange={() => dispatchFilter(
                    { shouldShowAdminDetails: !shouldShowAdminDetails },
                  )}
                />
              </div>
            )}
          </>
        )
      }
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

function ResetFilters({ dispatchFilter }) {
  return (
    <Button type="reset" size="mini" id="reset" onClick={() => dispatchFilter({ type: 'reset' })}>
      {I18n.t('competitions.index.reset_filters')}
    </Button>
  );
}

export default CompetitionsFilters;
