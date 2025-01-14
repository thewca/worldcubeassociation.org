import React, { useMemo } from 'react';
import {
  Button, ButtonGroup, Form, Segment,
} from 'semantic-ui-react';
import { EventSelector } from '../wca/EventSelector';
import { RegionSelector } from '../CompetitionsOverview/CompetitionsFilters';
import { countries } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';

export default function ResultsFilter({ filterState, filterActions, showCategories }) {
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
            onEventSelection={({ eventId }) => setEvent(eventId)}
            hideAllButton
            hideClearButton
          />
          <RegionSelector
            region={regionIso2}
            dispatchFilter={({ region: r }) => {
              if (r === 'all') {
                setRegion('world');
              } else {
                setRegion(countries.byIso2[r]?.id ?? r);
              }
            }}
          />
        </Form.Field>
        <Form.Group>
          { rankingType && (
            <Form.Field width={3}>
              <label>{I18n.t('results.selector_elements.type_selector.type')}</label>
              <ButtonGroup primary compact>
                <Button
                  active={rankingType === 'single'}
                  onClick={() => setRankingType('single')}
                >
                  {I18n.t('results.selector_elements.type_selector.single')}
                </Button>
                <Button active={rankingType === 'average'} onClick={() => setRankingType('average')}>{I18n.t('results.selector_elements.type_selector.average')}</Button>
              </ButtonGroup>
            </Form.Field>
          )}
          {/* <Form.Field width={1}> */}
          {/*   <ButtonGroup> */}
          {/*    <Button>All years</Button> */}
          {/*   </ButtonGroup> */}
          {/* </Form.Field> */}
          <Form.Field width={4}>
            <label>{I18n.t('results.selector_elements.gender_selector.gender')}</label>
            <ButtonGroup color="teal" compact>
              <Button active={gender === 'All'} onClick={() => setGender('All')}>{I18n.t('results.selector_elements.gender_selector.gender_all')}</Button>
              <Button active={gender === 'Male'} onClick={() => setGender('Male')}>{I18n.t('results.selector_elements.gender_selector.male')}</Button>
              <Button active={gender === 'Female'} onClick={() => setGender('Female')}>{I18n.t('results.selector_elements.gender_selector.female')}</Button>
            </ButtonGroup>
          </Form.Field>
          <Form.Field width={2}>
            <label>{I18n.t('results.selector_elements.show_selector.show')}</label>
            <ButtonGroup color="teal" compact>
              <Button active={show === '100 persons'} onClick={() => setShow('100 persons')}>{I18n.t('results.selector_elements.show_selector.persons')}</Button>
              <Button active={show === '100 results'} onClick={() => setShow('100 results')}>{I18n.t('results.selector_elements.show_selector.results')}</Button>
              <Button active={show === 'by region'} onClick={() => setShow('by region')}>{I18n.t('results.selector_elements.show_selector.by_region')}</Button>
            </ButtonGroup>
          </Form.Field>
        </Form.Group>
      </Form>
    </Segment>
  );
}
