import React from 'react';
import {
  Button, Icon, Popup,
} from 'semantic-ui-react';
import { WCA_EVENT_IDS } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';

export default function EventSelector({
  onEventSelection,
  title = I18n.t('competitions.competition_form.events'),
  eventList = WCA_EVENT_IDS,
  selectedEvents,
  onEventClick = (eventId) => onEventSelection({ type: 'toggle_event', eventId }),
  hideAllButton = false,
  onAllClick = () => onEventSelection({ type: 'select_all_events' }),
  hideClearButton = false,
  onClearClick = () => onEventSelection({ type: 'clear_events' }),
  disabled = false,
  shouldErrorOnEmpty = false,
  showBreakBeforeButtons = true,
  eventButtonsCompact = false,
  maxEvents = Infinity,
  eventsDisabled = [],
  // Listing event as an arg here to indicate to developers that it's available
  // eslint-disable-next-line no-unused-vars
  disabledText = (event) => {},
}) {
  return (
    <>
      <label htmlFor="events">
        {title}
        {showBreakBeforeButtons ? <br /> : (' ')}
        {hideAllButton || (
          <Popup
            disabled={!Number.isFinite(maxEvents)}
            trigger={(
              <span>
                <Button
                  disabled={disabled || eventList.length >= maxEvents}
                  primary
                  type="button"
                  size="mini"
                  id="select-all-events"
                  onClick={onAllClick}
                >
                  {I18n.t('competitions.index.all_events')}
                </Button>
              </span>
            )}
          >
            {I18n.t('competitions.registration_v2.register.event_limit', {
              max_events: maxEvents,
            })}
          </Popup>
        )}
        {hideClearButton || (
          <Button
            disabled={disabled}
            type="button"
            size="mini"
            id="clear-all-events"
            onClick={onClearClick}
          >
            {I18n.t('competitions.index.clear')}
          </Button>
        )}
      </label>
      <Popup
        open={selectedEvents.length === 0}
        disabled={!shouldErrorOnEmpty}
        position="bottom left"
        style={{ color: '#9f3a38' }}
        trigger={(
          <div id="events">
            {eventList.map((eventId) => {
              const isDisabled = disabled
                || (!selectedEvents.includes(eventId) && selectedEvents.length >= maxEvents)
                || eventsDisabled.includes(eventId);

              return (
                <Popup
                  key={eventId}
                  disabled={selectedEvents.length === 0}
                  trigger={(
                    <span>
                      {/* Wrap in span so hover works on disabled buttons */}
                      <Button
                        key={eventId}
                        disabled={isDisabled}
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
                        onClick={() => onEventClick(eventId)}
                        active={selectedEvents.includes(eventId)}
                      >
                        <Icon
                          className={`cubing-icon event-${eventId}`}
                          style={eventsDisabled.includes(eventId) ? { color: '#FFBBBB' } : {}}
                        />
                      </Button>
                    </span>
                  )}
                >
                  {eventsDisabled.includes(eventId) ? disabledText(eventId) : I18n.t(`events.${eventId}`)}
                </Popup>
              );
            })}
          </div>
        )}
      >
        {I18n.t('registrations.errors.must_register')}
      </Popup>
    </>
  );
}
