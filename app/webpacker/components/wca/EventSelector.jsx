import React from 'react';
import {
  Button, Icon, Popup,
} from 'semantic-ui-react';
import { events } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';

const WCA_EVENT_IDS = Object.values(events.official).map((e) => e.id);

export function EventSelector({
  selectedEvents,
  onEventSelection,
  eventList = WCA_EVENT_IDS,
  disabled = false,
  maxEvents = Infinity,
  shouldErrorOnEmpty = false,
  showBreakBeforeButtons = true,
  hideAllButton = false,
  hideClearButton = false,
  eventButtonsCompact = false,
  eventsDisabled = [],
  // Listing event as an argument here to indicate to developers that it's needed
  // eslint-disable-next-line no-unused-vars
  disabledText = (event) => {},
}) {
  return (
    <>
      <label htmlFor="events">
        {`${I18n.t('competitions.competition_form.events')}`}
        {showBreakBeforeButtons ? (<br />) : (' ')}
        {hideAllButton || (
          <Popup
            disabled={!Number.isFinite(maxEvents)}
            trigger={
              <span><Button disabled={disabled || eventList.length >= maxEvents} primary type="button" size="mini" id="select-all-events" onClick={() => onEventSelection({ type: 'select_all_events' })}>{I18n.t('competitions.index.all_events')}</Button></span>
            }
          >
            {I18n.t('competitions.registration_v2.register.event_limit', {
              max_events: maxEvents,
            })}
          </Popup>
        )}
        {hideClearButton || <Button disabled={disabled} type="button" size="mini" id="clear-all-events" onClick={() => onEventSelection({ type: 'clear_events' })}>{I18n.t('competitions.index.clear')}</Button>}
      </label>
      <Popup
        open={selectedEvents.length === 0}
        disabled={!shouldErrorOnEmpty}
        position="bottom left"
        style={{ color: '#9f3a38' }}
        trigger={(
          <div id="events">
            {eventList.map((eventId) => (
              <Popup
                key={eventId}
                disabled={selectedEvents.length === 0}
                trigger={(
                  <span>
                    {/* Wrap in span so hover works on disabled buttons */}
                    <Button
                      key={eventId}
                      disabled={
                      disabled
                        || (!selectedEvents.includes(eventId) && selectedEvents.length >= maxEvents)
                        || eventsDisabled.includes(eventId)
                    }
                      basic
                      compact={eventButtonsCompact}
                      icon
                      toggle
                      type="button"
                      size="mini"
                      className="event-checkbox"
                      id={`checkbox-${eventId}`}
                      value={eventId}
                      data-variation="tiny"
                      onClick={() => onEventSelection({ type: 'toggle_event', eventId })}
                      active={selectedEvents.includes(eventId)}
                    >
                      <Icon className={`cubing-icon event-${eventId}`} style={eventsDisabled.includes(eventId) ? { color: '#FFBBBB' } : {}} />
                    </Button>
                  </span>
                )}
              >
                {eventsDisabled.includes(eventId) ? disabledText(eventId) : I18n.t(`events.${eventId}`)}
              </Popup>
            ))}
          </div>
        )}
      >
        {I18n.t('registrations.errors.must_register')}
      </Popup>
    </>
  );
}
