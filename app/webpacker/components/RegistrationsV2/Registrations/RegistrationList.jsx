import { useQuery } from '@tanstack/react-query';
import React, {
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Segment,
} from 'semantic-ui-react';
import {
  getConfirmedRegistrations,
  getPsychSheetForEvent,
} from '../api/registration/get/get_registrations';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import { events } from '../../../lib/wca-data.js.erb';
import PsychSheet from './PsychSheet';
import PsychSheetEventSelector from './PsychSheetEventSelector';
import Competitors from './Competitors';

export default function RegistrationList({ competitionInfo, userId }) {
  const { isLoading: registrationsIsLoading, data: registrationsData, isError } = useQuery({
    queryKey: ['registrations', competitionInfo.id],
    queryFn: () => getConfirmedRegistrations(competitionInfo),
    retry: false,
  });

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

  const { isLoading: psychSheetIsLoading, data: psychSheetData } = useQuery({
    queryKey: [
      'psychSheet',
      competitionInfo.id,
      psychSheetEvent,
      psychSheetSortBy,
    ],
    queryFn: () => getPsychSheetForEvent(
      competitionInfo.id,
      psychSheetEvent,
      psychSheetSortBy,
    ),
    retry: false,
    enabled: isPsychSheet,
  });

  // psychSheetData is only missing the country iso2, otherwise we wouldn't
  //  need to mix in registrationData
  const registrationsWithPsychSheetData = useMemo(
    () => psychSheetData?.sorted_rankings?.map((p) => {
      const registrationEntry = registrationsData?.find((r) => p.user_id === r.user_id) || {};
      return { ...p, ...registrationEntry };
    }),
    [psychSheetData, registrationsData],
  );

  const userRowRef = useRef();
  const scrollToUser = () => userRowRef?.current?.scrollIntoView(
    { behavior: 'smooth', block: 'center' },
  );

  if (isError) {
    return (
      <Errored componentName="RegistrationList" />
    );
  }

  if (registrationsIsLoading || psychSheetIsLoading) {
    return (
      <Segment>
        <PsychSheetEventSelector
          handleEventSelection={handleEventSelection}
          eventList={competitionInfo.event_ids}
          selectedEvent={psychSheetEvent}
        />
        <Loading />
      </Segment>
    );
  }

  return (
    <Segment style={{ overflowX: 'scroll' }}>
      <PsychSheetEventSelector
        handleEventSelection={handleEventSelection}
        eventList={competitionInfo.event_ids}
        selectedEvent={psychSheetEvent}
      />
      {isPsychSheet ? (
        <PsychSheet
          registrations={registrationsWithPsychSheetData}
          psychSheetEvent={psychSheetEvent}
          psychSheetSortBy={psychSheetSortBy}
          setPsychSheetSortBy={setPsychSheetSortBy}
          userId={userId}
          userRowRef={userRowRef}
          onScrollToMeClick={scrollToUser}
        />
      ) : (
        <Competitors
          registrations={registrationsData}
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
