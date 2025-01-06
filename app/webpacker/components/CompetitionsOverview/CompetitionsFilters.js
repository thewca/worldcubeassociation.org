import React from 'react';
import {
  Button, Icon, Form, Dropdown, Popup, List, Input, Header,
} from 'semantic-ui-react';
import PulseLoader from 'react-spinners/PulseLoader';

import I18n from '../../lib/i18n';
import {
  continents, countries, competitionConstants, nonFutureCompetitionYears,
} from '../../lib/wca-data.js.erb';

import { DEFAULT_REGION_ALL } from './filterUtils';
import useDelegatesData from './useDelegatesData';
import UtcDatePicker from '../wca/UtcDatePicker';
import { EventSelector } from '../wca/EventSelector';

function CompetitionsFilters({
  filterState,
  dispatchFilter,
  displayMode,
  shouldShowAdminDetails,
  canViewAdminDetails,
}) {
  return (
    <Form className="competition-select" id="competition-query-form" acceptCharset="UTF-8">
      <Form.Field>
        <EventSelector
          selectedEvents={filterState.selectedEvents}
          onEventSelection={dispatchFilter}
          showBreakBeforeButtons={false}
          eventButtonsCompact
        />
      </Form.Field>

      <Form.Group widths="equal">
        <Form.Field>
          <RegionSelector region={filterState.region} dispatchFilter={dispatchFilter} />
        </Form.Field>
        <Form.Field>
          <SearchBar text={filterState.search} dispatchFilter={dispatchFilter} />
        </Form.Field>
      </Form.Group>

      {shouldShowAdminDetails && (
        <Form.Field>
          <DelegateSelector delegateId={filterState.delegate} dispatchFilter={dispatchFilter} />
        </Form.Field>
      )}

      <Form.Field>
        <TimeOrderButtonGroup filterState={filterState} dispatchFilter={dispatchFilter} />
      </Form.Field>

      <Form.Group inline>
        <CompDisplayCheckboxes
          shouldIncludeCancelled={filterState.shouldIncludeCancelled}
          dispatchFilter={dispatchFilter}
          shouldShowAdminDetails={shouldShowAdminDetails}
          canViewAdminDetails={canViewAdminDetails}
          displayMode={displayMode}
        />
      </Form.Group>

      {canViewAdminDetails && shouldShowAdminDetails && (
        <Form.Field>
          <AdminStatusButtonGroup filterState={filterState} dispatchFilter={dispatchFilter} />
        </Form.Field>
      )}
    </Form>
  );
}

export function RegionSelector({ region, dispatchFilter }) {
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
        key: country.id,
        text: country.name,
        value: country.iso2,
        flag: { className: country.iso2.toLowerCase() },
      }
    ))),
  ];

  // clearing should revert to the default, which itself should be un-clearable
  // but semantic ui will call onChange with the empty string
  return (
    <>
      <label htmlFor="region">{I18n.t('competitions.index.region')}</label>
      <Dropdown
        search
        selection
        clearable={region !== DEFAULT_REGION_ALL}
        value={region}
        options={regionsOptions}
        onChange={(_, data) => dispatchFilter({ region: data.value || DEFAULT_REGION_ALL })}
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
      <label htmlFor="delegate" style={{ display: 'inline-block' }}>
        {I18n.t('layouts.navigation.delegate')}
        {delegatesLoading && <PulseLoader id="delegate-pulse" size="6px" cssOverride={{ marginLeft: '5px' }} />}
      </label>
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
      <Button.Group id="state" size="small" compact primary>
        <Button
          name="state"
          id="present"
          value="present"
          onClick={() => dispatchFilter({ timeOrder: 'present' })}
          active={filterState.timeOrder === 'present'}
        >
          {I18n.t('competitions.index.present')}
        </Button>

        <Button
          name="state"
          id="recent"
          value="recent"
          onClick={() => dispatchFilter({ timeOrder: 'recent' })}
          active={filterState.timeOrder === 'recent'}
          data-tooltip={I18n.t('competitions.index.tooltips.recent', { count: competitionConstants.competitionRecentDays })}
        >
          {I18n.t('competitions.index.recent')}
        </Button>

        <PastCompYearSelector filterState={filterState} dispatchFilter={dispatchFilter} />

        <Button
          name="state"
          id="by_announcement"
          value="by_announcement"
          onClick={() => dispatchFilter({ timeOrder: 'by_announcement' })}
          active={filterState.timeOrder === 'by_announcement'}
          data-tooltip={I18n.t('competitions.index.sort_by_announcement')}
        >
          {I18n.t('competitions.index.by_announcement')}
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
      <Button.Group id="admin-status" compact>

        <Button
          primary
          name="admin-status"
          id="all"
          value="all"
          onClick={() => dispatchFilter({ adminStatus: 'all' })}
          active={filterState.adminStatus === 'all'}
        >
          {I18n.t('competitions.index.status_flags.all')}
        </Button>

        <Button
          color="yellow"
          name="admin-status"
          id="warning"
          value="warning"
          onClick={() => dispatchFilter({ adminStatus: 'warning' })}
          active={filterState.adminStatus === 'warning'}
        >
          {I18n.t('competitions.index.status_flags.warning')}
        </Button>

        <Button
          negative
          name="admin-status"
          id="danger"
          value="danger"
          onClick={() => dispatchFilter({ adminStatus: 'danger' })}
          active={filterState.adminStatus === 'danger'}
        >
          {I18n.t('competitions.index.status_flags.danger')}
        </Button>

      </Button.Group>
    </>
  );
}

function PastCompYearSelector({ filterState, dispatchFilter }) {
  return (
    <Button
      name="state"
      id="past"
      value="past"
      onClick={() => dispatchFilter({ timeOrder: 'past' })}
      active={filterState.timeOrder === 'past'}
    >
      {
        // eslint-disable-next-line no-nested-ternary
        filterState.timeOrder === 'past' ? (
          filterState.selectedYear === 'all_years' ? I18n.t('competitions.index.past_all')
            : I18n.t('competitions.index.past_from', { year: filterState.selectedYear })
        ) : I18n.t('competitions.index.past')
      }
      <Dropdown
        name="year"
        id="year"
        simple
        compact
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
          {nonFutureCompetitionYears.toReversed().map((year) => (
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
      name="state"
      id="custom"
      value="custom"
      onClick={() => dispatchFilter({ timeOrder: 'custom' })}
      active={filterState.timeOrder === 'custom'}
    >
      {I18n.t('competitions.index.custom')}
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

export function CompDisplayCheckboxes({
  shouldIncludeCancelled,
  dispatchFilter,
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
        displayMode === 'list' && canViewAdminDetails && (
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
        )
      }
    </>
  );
}

export function ToggleListOrMapDisplay({ displayMode, setDisplayMode }) {
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
