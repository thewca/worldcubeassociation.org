import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Button,
  Container,
  Divider,
  Dropdown,
  Form,
  Grid,
  Icon,
  Message,
  Popup, Segment,
  Sticky,
} from 'semantic-ui-react';

import FullCalendar from '@fullcalendar/react';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import luxonPlugin, { toLuxonDateTime, toLuxonDuration } from '@fullcalendar/luxon3';

import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import useInputState from '../../../lib/hooks/useInputState';
import ActivityPicker from './ActivityPicker';
import { roomWcifFromId, venueWcifFromRoomId } from '../../../lib/utils/wcif';
import { getTextColor } from '../../../lib/utils/calendar';

import {
  addActivity,
  moveActivity,
  removeActivity,
  scaleActivity,
} from '../store/actions';

import { friendlyTimezoneName } from '../../../lib/wca-data.js.erb';
import { defaultDurationFromActivityCode, luxonToWcifIso } from '../../../lib/utils/edit-schedule';
import EditActivityModal from './EditActivityModal';

function EditActivities({
  wcifEvents,
  calendarLocale,
}) {
  const { wcifSchedule } = useStore();
  const dispatch = useDispatch();

  const [selectedRoomId, setSelectedRoomId] = useInputState();

  const [minutesPerRow, setMinutesPerRow] = useInputState(15);
  const [calendarStart, setCalendarStart] = useInputState(8);
  const [calendarEnd, setCalendarEnd] = useInputState(20);

  // This part is ugly because Semantic-UI and Fullcalendar disagree
  //   about how modals should be handled.
  // According to Semantic-UI, modals are "always there" in the DOM,
  //   just that their "isOpen" state is false most of the time.
  //   So they simply don't show but they are already part of the DOM tree.
  // The (click-)event-based model of Fullcalendar however dictates that
  //   we can only "instantiate" a modal once the user actually clicks somewhere on the calendar.
  //   So we pre-fill the modal with empty state and set it accordingly on every event click.
  // If somebody has a better idea how to handle this, please shout.
  const [showActivityModal, setShowActivityModal] = useState(false);

  const [modalActivity, setModalActivity] = useState();

  const [modalLuxonStart, setModalLuxonStart] = useState();
  const [modalLuxonEnd, setModalLuxonEnd] = useState();
  // ------ MODAL HACK END ------

  const fcSlotDuration = useMemo(() => `00:${minutesPerRow.toString().padStart(2, '0')}:00`, [minutesPerRow]);

  const fcSlotMin = useMemo(() => `${calendarStart.toString().padStart(2, '0')}:00:00`, [calendarStart]);
  const fcSlotMax = useMemo(() => `${calendarEnd.toString().padStart(2, '0')}:00:00`, [calendarEnd]);

  const wcifVenue = useMemo(
    () => venueWcifFromRoomId(wcifSchedule, selectedRoomId),
    [selectedRoomId, wcifSchedule],
  );

  const wcifRoom = useMemo(
    () => roomWcifFromId(wcifSchedule, selectedRoomId),
    [selectedRoomId, wcifSchedule],
  );

  const venueOptions = useMemo(() => (
    wcifSchedule.venues.flatMap((venue) => (
      venue.rooms.map((room) => ({
        key: room.id,
        text: `"${room.name}" in "${venue.name}"`,
        value: room.id,
      }))
    ))
  ), [wcifSchedule.venues]);

  const fcActivities = useMemo(() => (
    wcifRoom?.activities.map((activity) => ({
      title: activity.name,
      start: activity.startTime,
      end: activity.endTime,
      extendedProps: {
        activityId: activity.id,
        activityCode: activity.activityCode,
        childActivities: activity.childActivities,
      },
    }))
  ), [wcifRoom?.activities]);

  // we 'fake' our own ref due to quirks in useRef + useEffect combinations.
  // See https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780
  const activityPickerRef = useCallback((node) => {
    if (!node) return;

    // eslint-disable-next-line no-new
    new Draggable(node, {
      itemSelector: '.fc-draggable',
      eventData: (eventEl) => {
        const activityCode = eventEl.getAttribute('wcif-ac');
        const defaultDuration = defaultDurationFromActivityCode(activityCode);

        return {
          title: eventEl.getAttribute('wcif-title'),
          duration: `00:${defaultDuration.toString().padStart(2, '0')}:00`,
          extendedProps: {
            activityCode,
          },
        };
      },
    });
  }, []);

  const dropToDeleteRef = useRef(null);

  const removeIfOverDropzone = ({ event: fcEvent, jsEvent }) => {
    if (!dropToDeleteRef.current) return;

    const elem = dropToDeleteRef.current;
    const rect = elem.getBoundingClientRect();

    const top = rect.top + window.scrollY;
    const bottom = rect.bottom + window.scrollY;
    const left = rect.left + window.scrollX;
    const right = rect.right + window.scrollX;

    if (
      jsEvent.pageX >= left
        && jsEvent.pageX <= right
        && jsEvent.pageY >= top
        && jsEvent.pageY <= bottom
    ) {
      const { activityId } = fcEvent.extendedProps;
      dispatch(removeActivity(activityId));
    }
  };

  const addActivityFromPicker = ({ event: fcEvent, view: { calendar } }) => {
    const eventStartLuxon = toLuxonDateTime(fcEvent.start, calendar);
    const eventEndLuxon = toLuxonDateTime(fcEvent.end, calendar);

    const utcStartIso = luxonToWcifIso(eventStartLuxon);
    const utcEndIso = luxonToWcifIso(eventEndLuxon);

    const { activityCode, childActivities } = fcEvent.extendedProps;

    const activity = {
      name: fcEvent.title,
      activityCode,
      startTime: utcStartIso,
      endTime: utcEndIso,
      childActivities: childActivities || [],
    };

    dispatch(addActivity(activity, wcifRoom.id));
  };

  const changeActivityTimeslot = ({
    event: fcEvent,
    delta,
    view: { calendar },
  }) => {
    const { activityId } = fcEvent.extendedProps;

    const duration = toLuxonDuration(delta, calendar);
    const deltaIso = duration.toISO();

    dispatch(moveActivity(activityId, deltaIso));
  };

  const resizeActivity = ({
    event: fcEvent,
    startDelta,
    endDelta,
    view: { calendar },
  }) => {
    const { activityId } = fcEvent.extendedProps;

    const startScaleDuration = toLuxonDuration(startDelta, calendar);
    const startScaleIso = startScaleDuration.toISO();

    const endScaleDuration = toLuxonDuration(endDelta, calendar);
    const endScaleIso = endScaleDuration.toISO();

    dispatch(scaleActivity(activityId, startScaleIso, endScaleIso));
  };

  const addActivityFromCalendar = (startLuxon, endLuxon) => {
    setModalLuxonStart(startLuxon);
    setModalLuxonEnd(endLuxon);

    setShowActivityModal(true);
  };

  const addActivityFromCalendarClick = ({ date, view: { calendar } }) => {
    const eventStartLuxon = toLuxonDateTime(date, calendar);
    const eventEndLuxon = eventStartLuxon.plus({ minutes: defaultDurationFromActivityCode('other') });

    addActivityFromCalendar(eventStartLuxon, eventEndLuxon);
  };

  const addActivityFromCalendarDrag = ({ start, end, view: { calendar } }) => {
    const eventStartLuxon = toLuxonDateTime(start, calendar);
    const eventEndLuxon = toLuxonDateTime(end, calendar);

    addActivityFromCalendar(eventStartLuxon, eventEndLuxon);
  };

  const onActivityModalClose = (ok, modalData) => {
    setShowActivityModal(false);

    const { activityCode, activityName } = modalData;

    if (ok) {
      if (modalActivity) {
        // TODO update existing activity

        setModalActivity(null);
      } else {
        const utcStartIso = luxonToWcifIso(modalLuxonStart);
        const utcEndIso = luxonToWcifIso(modalLuxonEnd);

        const activity = {
          name: activityName,
          activityCode,
          startTime: utcStartIso,
          endTime: utcEndIso,
          childActivities: [],
        };

        dispatch(addActivity(activity, wcifRoom.id));
      }
    }

    // cleanup.
    setModalLuxonStart(null);
    setModalLuxonEnd(null);
  };

  return (
    <>
      <Container textAlign="center">
        <Dropdown fluid placeholder="Venue" clearable selection options={venueOptions} value={selectedRoomId} onChange={setSelectedRoomId} />
      </Container>
      {!!selectedRoomId && (
        <>
          <Divider />
          <Container fluid>
            <EditActivityModal
              showModal={showActivityModal}
              activity={modalActivity}
              startLuxon={modalLuxonStart}
              endLuxon={modalLuxonEnd}
              dateLocale={calendarLocale}
              onModalClose={onActivityModalClose}
            />
            <Grid>
              <Grid.Row>
                <Grid.Column width={4}>
                  <Sticky>
                    <Segment
                      ref={activityPickerRef}
                    >
                      <ActivityPicker
                        wcifEvents={wcifEvents}
                        wcifRoom={wcifRoom}
                      />
                    </Segment>
                  </Sticky>
                </Grid.Column>
                <Grid.Column width={12}>
                  <Container text textAlign="center">
                    <span>
                      The timezone for this room is
                      {' '}
                      <b>{friendlyTimezoneName(wcifVenue.timezone)}</b>
                    </span>
                  </Container>
                  <Grid container textAlign="center" verticalAlign="middle">
                    <Grid.Column width={1}>
                      <Popup
                        trigger={<Button secondary icon="cog" />}
                        on="click"
                        position="right center"
                        pinned
                        flowing
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
                    </Grid.Column>
                    <Grid.Column width={15}>
                      <span ref={dropToDeleteRef}>
                        <Message negative floating>
                          <Icon name="trash" />
                          Drop an event here to remove it from the schedule.
                          <Icon name="trash" />
                        </Message>
                      </span>
                    </Grid.Column>
                  </Grid>
                  <FullCalendar
                    // plugins for the basic FullCalendar implementation.
                    //   - timeGridPlugin: Display days as vertical grid
                    //   - luxonPlugin: Support timezones
                    //   - interactionPlugin: Support dragging events from the sidebar
                    plugins={[timeGridPlugin, luxonPlugin, interactionPlugin]}
                    // define our "own" view (which is basically just saying how many days we want)
                    initialView="agendaForComp"
                    views={{
                      agendaForComp: {
                        type: 'timeGrid',
                        duration: { days: wcifSchedule.numberOfDays },
                      },
                    }}
                    initialDate={wcifSchedule.startDate}
                    // by default, FC offers support for separate "whole-day" events
                    allDaySlot={false}
                    // by default, FC would show a "skip to next day" toolbar
                    headerToolbar={false}
                    // the next three values can be configured via a popup menu
                    slotMinTime={fcSlotMin}
                    slotMaxTime={fcSlotMax}
                    slotDuration={fcSlotDuration}
                    // force FC to automagically compute an event's "end" flag,
                    //   if the event doesn't specify one itself
                    forceEventDuration
                    defaultTimedEventDuration="00:30:00"
                    // no debuf when an event drag was cancelled
                    dragRevertDuration={0}
                    // make it so that the user's mouse must travel some non-zero distance
                    //   until any "drag" event is triggered
                    selectMinDistance={5}
                    height="auto"
                    // intervals in which the events "snap" to the calendar grid
                    snapDuration="00:05:00"
                    // display color for background + text
                    eventColor={wcifRoom.color}
                    eventTextColor={getTextColor(wcifRoom.color)}
                    // localization settings
                    locale={calendarLocale}
                    timeZone={wcifVenue.timezone}
                    // FIRE IN DA HOLE!
                    events={fcActivities}
                    // make the calendar editable
                    editable
                    eventDragStop={removeIfOverDropzone}
                    // allow moving events as a whole around
                    eventStartEditable
                    eventDrop={changeActivityTimeslot}
                    // allow resizing events, and explicitly allow resizing on both ends
                    eventDurationEditable
                    eventResizableFromStart
                    eventResize={resizeActivity}
                    // allow dropping external events onto the schedule
                    droppable
                    eventReceive={addActivityFromPicker}
                    // allow highlighting an (empty) timeslot with your mouse to create a new event
                    selectable
                    dateClick={addActivityFromCalendarClick}
                    select={addActivityFromCalendarDrag}
                  />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </>
      )}
    </>
  );
}

export default EditActivities;
