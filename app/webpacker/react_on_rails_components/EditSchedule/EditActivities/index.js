import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Button,
  Container,
  Divider,
  Form,
  Grid,
  Icon, List,
  Message,
  Popup, Ref, Segment,
  Sticky,
} from 'semantic-ui-react';

import FullCalendar from '@fullcalendar/react';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import luxonPlugin, { toLuxonDateTime, toLuxonDuration } from '@fullcalendar/luxon3';

import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import useInputState from '../../../lib/hooks/useInputState';
import ActivityPicker from './ActivityPicker';
import {
  getMatchingActivities,
  isActivityTimeValid,
  roomWcifFromId,
  venueWcifFromRoomId,
} from '../../../lib/utils/wcif';
import { getTextColor } from '../../../lib/utils/calendar';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';

import {
  addActivity,
  editActivity,
  moveActivity,
  removeActivities,
  removeActivity,
  scaleActivity,
} from '../store/actions';

import {
  activityToFcTitle,
  buildPartialActivityFromCode,
  defaultDurationFromActivityCode, FC_ACTIVITY_ATTACHMENT,
  fcEventToActivityAndDates,
  luxonToWcifIso,
} from '../../../lib/utils/edit-schedule';
import EditActivityModal from './EditActivityModal';
import ActionsHeader from './ActionsHeader';
import { getTimeZoneDropdownLabel } from '../../../lib/utils/timezone';
import { earliestTimeOfDayWithBuffer, getHour, latestTimeOfDayWithBuffer } from '../../../lib/utils/activities';

function EditActivities({
  wcifEvents,
  referenceTime,
  calendarLocale,
}) {
  const { wcifSchedule } = useStore();
  const dispatch = useDispatch();

  const confirm = useConfirm();

  const [selectedRoomId, setSelectedRoomId] = useInputState();

  const [shouldUpdateMatches, setShouldUpdateMatches] = useCheckboxState(false);

  const [minutesPerRow, setMinutesPerRow] = useInputState(15);
  const [calendarStart, setCalendarStart] = useInputState(8);
  const [calendarEnd, setCalendarEnd] = useInputState(20);

  const setReasonableCalendarBounds = (room) => {
    const roomWcif = roomWcifFromId(wcifSchedule, room.id);
    const activities = roomWcif?.activities;
    const timezone = venueWcifFromRoomId(wcifSchedule, room.id)?.timezone;

    if (activities?.length) {
      setCalendarStart(
        Math.max(
          getHour(earliestTimeOfDayWithBuffer(activities, timezone)) - 1,
          0,
        ),
      );
      setCalendarEnd(
        Math.min(
          getHour(latestTimeOfDayWithBuffer(activities, timezone), { roundForward: true }) + 1,
          24,
        ),
      );
    }
  };

  const onSelectRoom = (room) => {
    setReasonableCalendarBounds(room);
    setSelectedRoomId(room.id);
  };

  // This part is ugly because Semantic-UI and Fullcalendar disagree
  //   about how modals should be handled.
  // According to Semantic-UI, modals are "always there" in the DOM,
  //   just that their "isOpen" state is false most of the time.
  //   So they simply don't show but they are already part of the DOM tree.
  // The (click-)event-based model of Fullcalendar however dictates that
  //   we can only "instantiate" a modal once the user actually clicks somewhere on the calendar.
  //   So we pre-fill the modal with empty state and set it accordingly on every event click.
  // If somebody has a better idea how to handle this, please shout.
  const [isActivityModalOpen, setActivityModalOpen] = useState(false);

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

  const earliestActivity = useMemo(
    () => (
      (wcifRoom && wcifVenue)
        ? earliestTimeOfDayWithBuffer(wcifRoom.activities, wcifVenue.timezone)
        : undefined
    ),
    [wcifRoom, wcifVenue],
  );

  useEffect(() => {
    if (earliestActivity) {
      setCalendarStart(
        (oldStart) => Math.min(
          oldStart,
          Math.max(0, getHour(earliestActivity) - 1),
        ),
      );
    }
  }, [earliestActivity, setCalendarStart]);

  const latestActivity = useMemo(
    () => (
      (wcifRoom && wcifVenue)
        ? latestTimeOfDayWithBuffer(wcifRoom.activities, wcifVenue.timezone)
        : undefined
    ),
    [wcifRoom, wcifVenue],
  );

  useEffect(() => {
    if (latestActivity) {
      setCalendarEnd(
        (oldEnd) => Math.max(
          oldEnd,
          Math.min(24, getHour(latestActivity, { roundForward: true }) + 1),
        ),
      );
    }
  }, [latestActivity, setCalendarEnd]);

  const fcActivities = useMemo(() => (
    wcifRoom?.activities.map((activity) => {
      const matchCount = getMatchingActivities(wcifSchedule, activity).length - 1;
      const matchesText = ` (${matchCount} matching activit${matchCount === 1 ? 'y' : 'ies'})`;

      const fcTitle = activityToFcTitle(activity) + (shouldUpdateMatches && matchCount > 0 ? matchesText : '');

      return {
        title: fcTitle,
        start: activity.startTime,
        end: activity.endTime,
        extendedProps: {
          [FC_ACTIVITY_ATTACHMENT]: activity,
          matchCount,
        },
      };
    })
  ), [wcifRoom?.activities, wcifSchedule, shouldUpdateMatches]);

  // theoretically this should always be empty, but there have been back-end bugs
  const activitiesWithInvalidTimes = wcifRoom?.activities?.filter(
    (activity) => !isActivityTimeValid(activity, wcifVenue, wcifSchedule),
  ) ?? [];

  const deleteInvalidActivities = () => {
    confirm({
      content: `Are you sure you want to delete the following event(s): ${
        activitiesWithInvalidTimes.map((a) => a.name).join(', ')
      }? THIS ACTION CANNOT BE UNDONE!`,
    }).then(() => {
      dispatch(removeActivities(activitiesWithInvalidTimes.map((a) => a.id), false));
    });
  };

  // we 'fake' our own ref due to quirks in useRef + useEffect combinations.
  // See https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780
  const activityPickerRef = useCallback((node) => {
    if (!node) return;

    // eslint-disable-next-line no-new
    new Draggable(node, {
      itemSelector: '.fc-draggable',
      eventData: (eventEl) => {
        const activityCode = eventEl.getAttribute('wcif-ac');

        const partialActivity = buildPartialActivityFromCode(activityCode);
        const defaultDuration = defaultDurationFromActivityCode(activityCode);

        return {
          title: activityToFcTitle(partialActivity),
          duration: `00:${defaultDuration.toString().padStart(2, '0')}:00`,
          extendedProps: {
            [FC_ACTIVITY_ATTACHMENT]: partialActivity,
          },
        };
      },
    });
  }, []);

  const dropToDeleteRef = useRef(null);

  const removeEvent = (fcEvent) => {
    const {
      [FC_ACTIVITY_ATTACHMENT]: {
        id: activityId,
        name: activityName,
      },
      matchCount,
    } = fcEvent.extendedProps;

    const matchText = `all ${matchCount + 1} copies of `;

    confirm({
      content: `Are you sure you want to delete ${shouldUpdateMatches && matchCount > 1 ? matchText : ''}the event ${activityName}? THIS ACTION CANNOT BE UNDONE!`,
    }).then(() => {
      dispatch(removeActivity(activityId, shouldUpdateMatches));
    });
  };

  const removeIfOverDropzone = ({ event: fcEvent, jsEvent }) => {
    if (!dropToDeleteRef.current) return;

    // Don't bother trying to delete an activity that hasn't even been added yet
    if (!fcEvent.extendedProps[FC_ACTIVITY_ATTACHMENT]?.id) return;

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
      removeEvent(fcEvent);
    }
  };

  const addActivityFromPicker = ({ event: fcEvent, view: { calendar } }) => {
    const { activity } = fcEventToActivityAndDates(fcEvent, calendar);

    dispatch(addActivity(activity, wcifRoom.id));
  };

  const changeActivityTimeslot = ({
    event: fcEvent,
    delta,
    view: { calendar },
  }) => {
    const { [FC_ACTIVITY_ATTACHMENT]: { id: activityId } } = fcEvent.extendedProps;

    const duration = toLuxonDuration(delta, calendar);
    const deltaIso = duration.toISO();

    dispatch(moveActivity(activityId, deltaIso, shouldUpdateMatches));
  };

  const resizeActivity = ({
    event: fcEvent,
    startDelta,
    endDelta,
    view: { calendar },
  }) => {
    const { [FC_ACTIVITY_ATTACHMENT]: { id: activityId } } = fcEvent.extendedProps;

    const startScaleDuration = toLuxonDuration(startDelta, calendar);
    const startScaleIso = startScaleDuration.toISO();

    const endScaleDuration = toLuxonDuration(endDelta, calendar);
    const endScaleIso = endScaleDuration.toISO();

    dispatch(scaleActivity(activityId, startScaleIso, endScaleIso, shouldUpdateMatches));
  };

  const addActivityFromCalendar = (startLuxon, endLuxon) => {
    setModalLuxonStart(startLuxon);
    setModalLuxonEnd(endLuxon);

    setActivityModalOpen(true);
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

  const editCustomEvent = ({ event: fcEvent, view: { calendar } }) => {
    const {
      activity,
      startLuxon,
      endLuxon,
    } = fcEventToActivityAndDates(fcEvent, calendar);

    const canEdit = activity.activityCode.startsWith('other-');

    if (canEdit) {
      setModalActivity(activity);

      setModalLuxonStart(startLuxon);
      setModalLuxonEnd(endLuxon);

      setActivityModalOpen(true);
    }
  };

  const closeActivityModalAndCleanUp = () => {
    // close
    setActivityModalOpen(false);

    // cleanup
    setModalActivity(null);

    setModalLuxonStart(null);
    setModalLuxonEnd(null);
  };

  const dispatchActivityModalUpdates = (modalData) => {
    const { activityCode, activityName } = modalData;

    if (modalActivity) {
      dispatch(editActivity(modalActivity.id, 'activityCode', activityCode, shouldUpdateMatches));
      dispatch(editActivity(modalActivity.id, 'name', activityName, shouldUpdateMatches));
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
  };

  const stickyRef = useRef();

  return (
    <div id="schedules-edit-panel-body">
      <Container textAlign="center">
        <List horizontal size="large">
          {wcifSchedule.venues.map((venue) => (
            <List.Item key={venue.id}>
              <Icon name="home" />
              <List.Content>
                <List.Header>{venue.name}</List.Header>
                <List.List>
                  {venue.rooms.map((room) => (
                    <List.Item
                      key={room.id}
                      as="a"
                      onClick={() => onSelectRoom(room)}
                    >
                      {room.id === wcifRoom?.id ? <b>{room.name}</b> : room.name}
                    </List.Item>
                  ))}
                </List.List>
              </List.Content>
            </List.Item>
          ))}
        </List>
      </Container>
      <Divider />
      {selectedRoomId === undefined && (
        <Message info>Please select a room by clicking one of the labels above</Message>
      )}
      {selectedRoomId !== undefined && (
        <div ref={stickyRef}>
          <Container fluid>
            <EditActivityModal
              isModalOpen={isActivityModalOpen}
              activity={modalActivity}
              startLuxon={modalLuxonStart}
              endLuxon={modalLuxonEnd}
              dateLocale={calendarLocale}
              onModalClose={closeActivityModalAndCleanUp}
              onModalSave={dispatchActivityModalUpdates}
            />
            <ActionsHeader
              selectedRoomId={selectedRoomId}
              shouldUpdateMatches={shouldUpdateMatches}
              setShouldUpdateMatches={setShouldUpdateMatches}
            />
            <Grid>
              <Grid.Row>
                <Grid.Column width={4}>
                  <Sticky context={stickyRef} offset={10}>
                    <Segment>
                      <Ref innerRef={dropToDeleteRef}>
                        <Message negative floating>
                          <Icon name="trash" />
                          Drop an event here to remove it from the schedule.
                        </Message>
                      </Ref>
                      <ActivityPicker
                        wcifEvents={wcifEvents}
                        wcifRoom={wcifRoom}
                        listRef={activityPickerRef}
                      />
                    </Segment>
                  </Sticky>
                </Grid.Column>
                <Grid.Column width={12}>
                  <Container text textAlign="center">
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
                    {' '}
                    The timezone for this room is
                    {' '}
                    <b>
                      {getTimeZoneDropdownLabel(
                        wcifVenue.timezone,
                        earliestActivity || referenceTime,
                        calendarLocale,
                      )}
                    </b>
                    .
                  </Container>
                  {activitiesWithInvalidTimes.length > 0 && (
                    <Message negative floating>
                      <b>Warning:</b>
                      {' '}
                      You have activities outside the competition
                      dates or with non-positive durations.
                      {' '}
                      <Button onClick={deleteInvalidActivities} size="tiny" compact negative>
                        Delete them.
                      </Button>
                    </Message>
                  )}
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
                    // allow clicking on existing (custom) events to edit them
                    eventClick={editCustomEvent}
                    // allow right-clicking on (any) existing events to delete them;
                    //  no direct `eventContextMenu` prop or anything like that unfortunately
                    eventDidMount={(arg) => {
                      arg.el.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        removeEvent(arg.event);
                      });
                    }}
                  />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </div>
      )}
    </div>
  );
}

export default EditActivities;
