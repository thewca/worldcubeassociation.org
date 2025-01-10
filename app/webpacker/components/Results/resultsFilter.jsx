import React, { useMemo } from 'react';
import {
  Button, ButtonGroup, Form, Segment,
} from 'semantic-ui-react';
import { EventSelector } from '../wca/EventSelector';
import { RegionSelector } from '../CompetitionsOverview/CompetitionsFilters';
import { countries } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';

export default function ResultsFilter({ filterState }) {
  const {
    event,
    setEvent,
    region,
    setRegion,
    rankingType,
    setRankingType,
    gender,
    setGender,
    show,
    setShow,
  } = filterState;
  const regionIso2 = useMemo(() => {
    if (region === 'world') {
      return 'all';
    }
    const iso2 = countries.real.find((country) => country.id === region)?.iso2;
    if (iso2) {
      return iso2;
    }
    return region;
  }, [region]);
  return (
    <Segment raised>
      <Form>
        <Form.Field>
          <EventSelector
            selectedEvents={[event]}
            onEventSelection={({ eventId }) => setEvent(eventId)}
            hideAllButton
            hideClearButton
          />
          <RegionSelector
            region={regionIso2}
            dispatchFilter={({ region: r }) => setRegion(countries.byIso2[r]?.id ?? r)}
          />
        </Form.Field>
        <Form.Group>
          <Form.Field width={3}>
            <label>{I18n.t('results.selector_elements.type_selector.type')}</label>
            <ButtonGroup primary>
              <Button
                active={rankingType === 'single'}
                onClick={() => setRankingType('single')}
              >
                {I18n.t('results.selector_elements.type_selector.single')}
              </Button>
              <Button active={rankingType === 'average'} onClick={() => setRankingType('average')}>{I18n.t('results.selector_elements.type_selector.average')}</Button>
            </ButtonGroup>
          </Form.Field>
          {/* <Form.Field width={1}> */}
          {/*   <ButtonGroup> */}
          {/*    <Button>All years</Button> */}
          {/*   </ButtonGroup> */}
          {/* </Form.Field> */}
          <Form.Field width={4}>
            <label>{I18n.t('results.selector_elements.gender_selector.gender')}</label>
            <ButtonGroup color="teal">
              <Button active={gender === 'All'} onClick={() => setGender('All')}>{I18n.t('results.selector_elements.gender_selector.gender_all')}</Button>
              <Button active={gender === 'Male'} onClick={() => setGender('Male')}>{I18n.t('results.selector_elements.gender_selector.male')}</Button>
              <Button active={gender === 'Female'} onClick={() => setGender('Female')}>{I18n.t('results.selector_elements.gender_selector.female')}</Button>
            </ButtonGroup>
          </Form.Field>
          <Form.Field width={2}>
            <label>{I18n.t('results.selector_elements.show_selector.show')}</label>
            <ButtonGroup color="teal">
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
