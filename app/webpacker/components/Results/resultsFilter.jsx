import React, { useMemo } from 'react';
import {
  Button, ButtonGroup, Form, Segment,
} from 'semantic-ui-react';
import { EventSelector } from '../wca/EventSelector';
import { RegionSelector } from '../CompetitionsOverview/CompetitionsFilters';
import { countries } from '../../lib/wca-data.js.erb';

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
            <label>Type</label>
            <ButtonGroup primary>
              <Button
                active={rankingType === 'single'}
                onClick={() => setRankingType('single')}
              >
                Single
              </Button>
              <Button active={rankingType === 'average'} onClick={() => setRankingType('average')}>Average</Button>
            </ButtonGroup>
          </Form.Field>
          {/* <Form.Field width={1}> */}
          {/*   <ButtonGroup> */}
          {/*    <Button>All years</Button> */}
          {/*   </ButtonGroup> */}
          {/* </Form.Field> */}
          <Form.Field width={4}>
            <label>Gender</label>
            <ButtonGroup color="teal">
              <Button active={gender === 'All'} onClick={() => setGender('All')}>All</Button>
              <Button active={gender === 'Male'} onClick={() => setGender('Male')}>Male</Button>
              <Button active={gender === 'Female'} onClick={() => setGender('Female')}>Female</Button>
            </ButtonGroup>
          </Form.Field>
          <Form.Field width={2}>
            <label>Show</label>
            <ButtonGroup color="teal">
              <Button active={show === '100 persons'} onClick={() => setShow('100 persons')}>Persons</Button>
              <Button active={show === '100 results'} onClick={() => setShow('100 results')}>Results</Button>
              <Button active={show === 'by region'} onClick={() => setShow('by region')}>By Region</Button>
            </ButtonGroup>
          </Form.Field>
        </Form.Group>
      </Form>
    </Segment>
  );
}
