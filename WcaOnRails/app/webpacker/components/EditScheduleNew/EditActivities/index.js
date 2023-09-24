import React, { useMemo } from 'react';
import {
  Checkbox,
  Container,
  Dropdown,
  Header,
  Image,
  Menu,
  Segment,
  Sidebar,
} from 'semantic-ui-react';

import FullCalendar from '@fullcalendar/react';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

import { useStore } from '../../../lib/providers/StoreProvider';
import useInputState from '../../../lib/hooks/useInputState';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import ActivityPicker from './ActivityPicker';

function EditActivities({
  wcifEvents,
}) {
  const { wcifSchedule } = useStore();

  const [selectedRoom, setSelectedVenue] = useInputState();
  const [showSidebar, setShowSidebar] = useCheckboxState(true);

  const venueOptions = useMemo(() => {
    return wcifSchedule.venues.flatMap((venue) => {
      return venue.rooms.map((room) => {
        return {
          key: `${venue.id}-${room.id}`,
          text: `"${room.name}" in "${venue.name}"`,
          value: `${venue.id}-${room.id}`,
        };
      });
    });
  }, [wcifSchedule.venues]);

  return (
    <>
      <Container fluid>
        <Dropdown placeholder="Venue" clearable selection options={venueOptions} onChange={setSelectedVenue} />
        <Checkbox checked={showSidebar} toggle label="Show activities" onChange={setShowSidebar} />
      </Container>
      {!!selectedRoom && (
        <Sidebar.Pushable>
          <Sidebar
            animation="push"
            direction="left"
            visible={showSidebar}
          >
            <ActivityPicker
              wcifEvents={wcifEvents}
            />
          </Sidebar>
          <Sidebar.Pusher>
            <FullCalendar
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="agendaForComp"
              views={{
                agendaForComp: {
                  type: 'timeGrid',
                  duration: { days: 1 }, // TODO number of days!
                },
              }}
              allDaySlot={false}
              headerToolbar={false}
              slotMinTime="8:00:00"
              slotMaxTime="20:00:00"
              slotDuration="00:15:00"
              forceEventDuration
              dragRevertDuration={0}
              height="auto"
              snapDuration="00:05:00"
              defaultTimedEventDuration="00:30:00"
            />
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      )}
    </>
  );
}

export default EditActivities;
