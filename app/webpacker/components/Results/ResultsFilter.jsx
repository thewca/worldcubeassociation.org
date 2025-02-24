import React, { useMemo } from 'react';
import {
  Button, ButtonGroup, Form, Header, Segment,
} from 'semantic-ui-react';
import _ from 'lodash';
import EventSelector from '../wca/EventSelector';
import { countries } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';
import RegionSelector from '../wca/RegionSelector';

function getRegionIdWithFallback(region) {
  if (region === 'all') {
    return 'world';
  }
  return countries.byIso2[region]?.id ?? region;
}

export default function ResultsFilter({
  filterState,
  filterActions,
  showCategories,
  clearEventIsAllowed = false,
}) {
  const {
    event,
    region,
    rankingType,
    gender,
    show,
  } = filterState;

  const {
    setEvent,
    setRegion,
    setRankingType,
    setGender,
    setShow,
  } = filterActions;

  const regionIso2 = useMemo(() => {
    if (region === 'world') {
      return 'all';
    }
    return countries.real.find((country) => country.id === region)?.iso2 || region;
  }, [region]);
  return (
    <Segment raised>
      <Form>
        <Form.Field>
          <EventSelector
            title={I18n.t('results.selector_elements.events_selector.event')}
            selectedEvents={[event]}
            onEventClick={setEvent}
            hideAllButton
            hideClearButton={!clearEventIsAllowed || !event}
            onClearClick={() => setEvent(undefined)}
            showBreakBeforeButtons={false}
          />
        </Form.Field>
        <Form.Field>
          <RegionSelector
            region={regionIso2}
            dispatchFilter={({ region: r }) => setRegion(getRegionIdWithFallback(r))}
          />
        </Form.Field>
        <Form.Group widths="equal">
          { rankingType && (
            <Form.Field>
              <Header as="h6">{I18n.t('results.selector_elements.type_selector.type')}</Header>
              <ButtonGroup primary compact widths={2}>
                <Button
                  active={rankingType === 'single'}
                  onClick={() => setRankingType('single')}
                >
                  {I18n.t('results.selector_elements.type_selector.single')}
                </Button>
                {event !== '333mbf' && <Button active={rankingType === 'average'} onClick={() => setRankingType('average')}>{I18n.t('results.selector_elements.type_selector.average')}</Button>}
              </ButtonGroup>
            </Form.Field>
          )}
          {/* <Form.Field width={1}> */}
          {/*   <ButtonGroup> */}
          {/*    <Button>All years</Button> */}
          {/*   </ButtonGroup> */}
          {/* </Form.Field> */}
          <Form.Field>
            <Header as="h6">{I18n.t('results.selector_elements.gender_selector.gender')}</Header>
            <ButtonGroup compact color="teal" widths={3}>
              <Button active={gender === 'All'} onClick={() => setGender('All')}>{I18n.t('results.selector_elements.gender_selector.gender_all')}</Button>
              <Button active={gender === 'Male'} onClick={() => setGender('Male')}>{I18n.t('results.selector_elements.gender_selector.male')}</Button>
              <Button active={gender === 'Female'} onClick={() => setGender('Female')}>{I18n.t('results.selector_elements.gender_selector.female')}</Button>
            </ButtonGroup>
          </Form.Field>
          <Form.Field>
            <Header as="h6">{I18n.t('results.selector_elements.show_selector.show')}</Header>
            <ButtonGroup compact color="teal" widths={showCategories.length}>
              {showCategories.map((category) => (
                <Button key={category} active={show === category} onClick={() => setShow(category)}>{I18n.t(`results.selector_elements.show_selector.${_.snakeCase(category.replace(/^\d+/, '').trim())}`)}</Button>
              ))}
            </ButtonGroup>
          </Form.Field>
        </Form.Group>
      </Form>
    </Segment>
  );
}
