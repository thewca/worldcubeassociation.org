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
  const [psychSheetEventId, setPsychSheetEventId] = useState();
  const [psychSheetSortedBy, setPsychSheetSortedBy] = useState();

  const showPsychSheetFor = (eventId) => {
    const event = events.byId[eventId];
    setPsychSheetEventId(eventId);
    setPsychSheetSortedBy(event.recommendedFormat().sortBy);
  };
  const returnToCompetitorsList = () => {
    setPsychSheetEventId(undefined);
    setPsychSheetSortedBy(undefined);
  };

  const anEventIsSelected = psychSheetEventId !== undefined;

  const userRowRef = useRef();
  const scrollToUser = () => userRowRef?.current?.scrollIntoView(
    { behavior: 'smooth', block: 'center' },
  );

  return (
    <Segment>
      <PsychSheetEventSelector
        eventList={competitionInfo.event_ids}
        selectedEvent={psychSheetEventId}
        onEventClick={
          (eventId) => eventId !== psychSheetEventId && showPsychSheetFor(eventId)
        }
        onClearClick={returnToCompetitorsList}
      />
      {anEventIsSelected ? (
        <PsychSheet
          competitionInfo={competitionInfo}
          selectedEvent={psychSheetEventId}
          sortedBy={psychSheetSortedBy}
          setSortedBy={setPsychSheetSortedBy}
          userId={userId}
          userRowRef={userRowRef}
          onScrollToMeClick={scrollToUser}
        />
      ) : (
        <Competitors
          competitionInfo={competitionInfo}
          eventIds={competitionInfo.event_ids}
          onEventClick={showPsychSheetFor}
          userId={userId}
          userRowRef={userRowRef}
          onScrollToMeClick={scrollToUser}
        />
      )}
    </Segment>
  );
}
