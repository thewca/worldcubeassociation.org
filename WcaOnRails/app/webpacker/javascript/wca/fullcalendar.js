import _ from 'lodash';

const fullCalendarOptions = {
  defaultView: 'agendaForComp',
  header: false,
  allDaySlot: false,
  locale: 'en',
  minTime: '8:00:00',
  maxTime: '20:00:00',
  slotDuration: '00:15:00',
  // Without this, fullcalendar doesn't set the "end" time.
  forceEventDuration: true,
  dragRevertDuration: 0,
  height: 'auto',
  snapDuration: '00:05:00',
  defaultTimedEventDuration: '00:30:00',
};

export default (day, numberOfDays) => {
  const options = _.cloneDeep(fullCalendarOptions);
  _.assign(options, {
    defaultDate: day,
    // see: https://fullcalendar.io/docs/views/Custom_Views/
    views: {
      agendaForComp: {
        type: 'agenda',
        duration: { days: numberOfDays },
        buttonText: 'Calendar',
      },
    },
  });
  return options;
};
