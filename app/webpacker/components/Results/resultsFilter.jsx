import React from 'react';
import {
  Button, ButtonGroup, Form, Segment,
} from 'semantic-ui-react';
import { EventSelector } from '../wca/EventSelector';
import { RegionSelector } from '../CompetitionsOverview/CompetitionsFilters';

export default function ResultsFilter({ filterState }) {
  const {
    event, setEvent, region, setRegion, rankingType, setRankingType, gender, setGender,
  } = filterState;
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
          <RegionSelector region={region} dispatchFilter={({ region: r }) => setRegion(r)} />
        </Form.Field>
        <Form.Group>
          <Form.Field width={3}>
            <label>Type</label>
            <ButtonGroup>
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
            <ButtonGroup>
              <Button active={gender === 'All'} onClick={() => setGender('All')}>All</Button>
              <Button active={gender === 'Male'} onClick={() => setGender('Male')}>Male</Button>
              <Button active={gender === 'Female'} onClick={() => setGender('Female')}>Female</Button>
            </ButtonGroup>
          </Form.Field>
          <Form.Field width={2}>
            <label>Show</label>
            <ButtonGroup>
              <Button>Results</Button>
              <Button>By Region</Button>
            </ButtonGroup>
          </Form.Field>
        </Form.Group>
      </Form>
    </Segment>
  );
}
