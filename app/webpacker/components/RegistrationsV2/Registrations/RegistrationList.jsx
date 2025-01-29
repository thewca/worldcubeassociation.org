import React, {
  useRef,
  useState,
} from 'react';
import {
  Segment,
} from 'semantic-ui-react';
import { events } from '../../../lib/wca-data.js.erb';
import PsychSheet from './PsychSheet';
import PsychSheetEventSelector from './PsychSheetEventSelector';
import Competitors from './Competitors';

export default function RegistrationList({ competitionInfo, userId }) {
  const [psychSheetEvent, setPsychSheetEvent] = useState();
  const [psychSheetSortBy, setPsychSheetSortBy] = useState();
  const isPsychSheet = psychSheetEvent !== undefined;

  const onEventClick = (eventId) => {
    setPsychSheetEvent(eventId);
    const event = events.byId[eventId];
    setPsychSheetSortBy(event.recommendedFormat().sortBy);
  };
  const handleEventSelection = ({ type, eventId }) => {
    if (type === 'toggle_event') {
      onEventClick(eventId);
    } else {
      setPsychSheetEvent(undefined);
    }
  };

  const userRowRef = useRef();
  const scrollToUser = () => userRowRef?.current?.scrollIntoView(
    { behavior: 'smooth', block: 'center' },
  );

  return (
    <Segment style={{ overflowX: 'scroll' }}>
      <PsychSheetEventSelector
        handleEventSelection={handleEventSelection}
        eventList={competitionInfo.event_ids}
        selectedEvent={psychSheetEvent}
      />
      {isPsychSheet ? (
        <PsychSheet
          competitionInfo={competitionInfo}
          psychSheetEvent={psychSheetEvent}
          psychSheetSortBy={psychSheetSortBy}
          setPsychSheetSortBy={setPsychSheetSortBy}
          userId={userId}
          userRowRef={userRowRef}
          onScrollToMeClick={scrollToUser}
        />
      ) : (
        <Competitors
          competitionInfo={competitionInfo}
          eventIds={competitionInfo.event_ids}
          onEventClick={onEventClick}
          userId={userId}
          userRowRef={userRowRef}
          onScrollToMeClick={scrollToUser}
        />
      )}
    </Segment>
  );
}
