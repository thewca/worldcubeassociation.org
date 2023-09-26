import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  Checkbox,
  Container,
  Divider,
  Dropdown,
  Form, Grid,
  Icon,
  List,
  Message,
  Popup, Rail, Segment,
  Sidebar, Sticky,
} from 'semantic-ui-react';

import FullCalendar from '@fullcalendar/react';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import luxonPlugin from '@fullcalendar/luxon3';

import { useStore } from '../../../lib/providers/StoreProvider';
import useInputState from '../../../lib/hooks/useInputState';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import ActivityPicker from './ActivityPicker';
import { roomWcifFromId, venueWcifFromRoomId } from '../../../lib/utils/wcif';
import { getTextColor } from '../../../lib/utils/calendar';
import useToggleButtonState from '../../../lib/hooks/useToggleButtonState';

function EditActivities({
  wcifEvents,
  calendarLocale,
}) {
  const { wcifSchedule } = useStore();

  const [selectedRoomId, setSelectedRoomId] = useInputState();

  const [minutesPerRow, setMinutesPerRow] = useInputState(15);
  const [calendarStart, setCalendarStart] = useInputState(8);
  const [calendarEnd, setCalendarEnd] = useInputState(20);

  const [isKeyboardEnabled, setKeyboardEnabled] = useToggleButtonState(false);

  const fcSlotDuration = useMemo(() => {
    return `00:${minutesPerRow.toString().padStart(2, '0')}:00`;
  }, [minutesPerRow]);

  const fcSlotMin = useMemo(() => {
    return `${calendarStart.toString().padStart(2, '0')}:00:00`;
  }, [calendarStart]);

  const fcSlotMax = useMemo(() => {
    return `${calendarEnd.toString().padStart(2, '0')}:00:00`;
  }, [calendarEnd]);

  const wcifVenue = useMemo(() => {
    return venueWcifFromRoomId(wcifSchedule, selectedRoomId);
  }, [selectedRoomId, wcifSchedule]);

  const wcifRoom = useMemo(() => {
    return roomWcifFromId(wcifSchedule, selectedRoomId);
  }, [selectedRoomId, wcifSchedule]);

  const venueOptions = useMemo(() => {
    return wcifSchedule.venues.flatMap((venue) => {
      return venue.rooms.map((room) => {
        return {
          key: room.id,
          text: `"${room.name}" in "${venue.name}"`,
          value: room.id,
        };
      });
    });
  }, [wcifSchedule.venues]);

  const fcActivities = useMemo(() => {
    return wcifRoom?.activities.map((activity) => {
      return {
        id: activity.id,
        title: activity.name,
        start: activity.startTime,
        end: activity.endTime,
      };
    });
  }, [wcifRoom?.activities]);

  // we 'fake' our own ref due to quirks in useRef + useEffect combinations.
  // See https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780
  const activityPickerRef = useCallback((node) => {
    if (!node) return;

    new Draggable(node, {
      itemSelector: '.fc-draggable',
    });
  }, []);

  const dropToDeleteRef = useRef(null);

  const removeIfOverDropzone = ({ fcEvent, jsEvent, view: { calendar } }) => {
    if (!dropToDeleteRef.current) return;

    const elem = dropToDeleteRef.current;
    const rect = elem.getBoundingClientRect();

    const top = rect.top + window.scrollY;
    const bottom = rect.bottom + window.scrollY;
    const left = rect.left + window.scrollX;
    const right = rect.right + window.scrollX;

    if (jsEvent.pageX >= left && jsEvent.pageX <= right && jsEvent.pageY >= top && jsEvent.pageY <= bottom) {
      console.log('Imma remove!');
    }
  };

  return (
    <>
      <Dropdown placeholder="Venue" clearable selection options={venueOptions} onChange={setSelectedRoomId} />
      {!!selectedRoomId && (
        <Container>
          <Grid>
            <Grid.Row>
              <Grid.Column width={4}>
                <Sticky>
                  <div
                    ref={activityPickerRef}
                  >
                    <ActivityPicker
                      wcifEvents={wcifEvents}
                    />
                  </div>
                </Sticky>
              </Grid.Column>
              <Grid.Column width={12}>
                <Button.Group basic>
                  <Popup
                    trigger={<Button icon="question circle" />}
                    position="bottom center"
                  >
                    <Popup.Header>Keyboard shortcuts help</Popup.Header>
                    <Popup.Content>
                      <List>
                        <List.Item>
                          <List.Header>Icon or [C]+i</List.Header>
                          <List.Description>Toggle keyboard shortcuts</List.Description>
                        </List.Item>
                        <List.Item>
                          <List.Header>Arrow keys</List.Header>
                          <List.Description>Change selected event in calendar</List.Description>
                        </List.Item>
                        <List.Item>
                          <List.Header>[S] + Arrow keys</List.Header>
                          <List.Description>Change selected activity in picker</List.Description>
                        </List.Item>
                        <List.Item>
                          <List.Header>Enter</List.Header>
                          <List.Description>Add selected activity after selected event</List.Description>
                        </List.Item>
                        <List.Item>
                          <List.Header>[Del]</List.Header>
                          <List.Description>Remove selected event</List.Description>
                        </List.Item>
                        <List.Item>
                          <List.Header>[C] + Arrow keys</List.Header>
                          <List.Description>Move selected event around in calendar</List.Description>
                        </List.Item>
                        <List.Item>
                          <List.Header>[C] + [S] + up/down</List.Header>
                          <List.Description>Shrink/Expand selected event in calendar</List.Description>
                        </List.Item>
                        <List.Item>
                          <List.Header>[C] + [S] + click</List.Header>
                          <List.Description>Show contextual menu for event</List.Description>
                        </List.Item>
                        <Divider />
                        <List.Item>
                          <List.Header>[C]</List.Header>
                          <List.Description>...means Control/CTRL key</List.Description>
                        </List.Item>
                        <List.Item>
                          <List.Header>[S]</List.Header>
                          <List.Description>...means Shift key</List.Description>
                        </List.Item>
                      </List>
                    </Popup.Content>
                  </Popup>
                  <Popup
                    trigger={<Button icon="cog" />}
                    on="click"
                    position="bottom center"
                    pinned
                  >
                    <Popup.Header>Calendar settings</Popup.Header>
                    <Popup.Content>
                      <Form>
                        <Form.Input
                          label="Minutes per row"
                          name="row-mins"
                          type="number"
                          min={5}
                          max={30}
                          step={5}
                          value={minutesPerRow}
                          onChange={setMinutesPerRow}
                        />
                        <Form.Input
                          label="Calendar starts at"
                          name="cal-start"
                          type="number"
                          min={0}
                          max={24}
                          value={calendarStart}
                          onChange={setCalendarStart}
                        />
                        <Form.Input
                          label="Calendar ends at"
                          name="cal-end"
                          type="number"
                          min={0}
                          max={24}
                          value={calendarEnd}
                          onChange={setCalendarEnd}
                        />
                      </Form>
                    </Popup.Content>
                  </Popup>
                  <Button
                    icon="keyboard"
                    toggle
                    active={isKeyboardEnabled}
                    onClick={setKeyboardEnabled}
                  />
                </Button.Group>
                <Message negative compact>
                  <Icon name="trash" />
                  <span
                    ref={dropToDeleteRef}
                  >
                Drop an event here to remove it from the schedule.
              </span>
                  <Icon name="trash" />
                </Message>
                <Container text textAlign="center">
                  The timezone for this room is
                  {' '}
                  <b>{wcifVenue.timezone}</b>
                </Container>
                <FullCalendar
                  plugins={[timeGridPlugin, luxonPlugin, interactionPlugin]}
                  initialView="agendaForComp"
                  views={{
                    agendaForComp: {
                      type: 'timeGrid',
                      duration: { days: wcifSchedule.numberOfDays },
                    },
                  }}
                  initialDate={wcifSchedule.startDate}
                  allDaySlot={false}
                  headerToolbar={false}
                  slotMinTime={fcSlotMin}
                  slotMaxTime={fcSlotMax}
                  slotDuration={fcSlotDuration}
                  forceEventDuration
                  dragRevertDuration={0}
                  selectMinDistance={5}
                  height="auto"
                  snapDuration="00:05:00"
                  defaultTimedEventDuration="00:30:00"
                  events={fcActivities}
                  eventColor={wcifRoom.color}
                  eventTextColor={getTextColor(wcifRoom.color)}
                  locale={calendarLocale}
                  timeZone={wcifVenue.timezone}
                  editable
                  eventStartEditable
                  eventDurationEditable
                  eventResizableFromStart
                  droppable
                  selectable
                  eventDragStop={removeIfOverDropzone}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
      )}
    </>
  );
}

export default EditActivities;
