import React, { useCallback, useMemo } from 'react';
import { Button, Header } from 'semantic-ui-react';
import EventSelector from '../wca/EventSelector';
import I18n from '../../lib/i18n';
import { roundToRoundTypeName } from './util';
import DndWorkbench from './DndWorkbench';

function RoundsButtonPicker({
  availableOptions: availableRounds,
  selectedId,
  setSelectedId,
  selectedEvent,
}) {
  return (
    <>
      <Header as="h4">
        {I18n.t('round.title')}
        {' '}
        <Button
          size="mini"
          onClick={() => setSelectedId(null)}
        >
          {I18n.t('competitions.index.clear')}
        </Button>
      </Header>
      <Button.Group>
        {availableRounds.map((round) => (
          <Button
            key={round.id}
            toggle
            basic
            active={round.id === selectedId}
            onClick={() => setSelectedId(round.id)}
          >
            {roundToRoundTypeName(round, selectedEvent, true)}
          </Button>
        ))}
      </Button.Group>
    </>
  );
}

function EventPickerCompat({
  availableOptions: availableEvents,
  selectedId,
  setSelectedId,
}) {
  const availableEventIds = useMemo(
    () => availableEvents.map((opt) => opt.id),
    [availableEvents],
  );

  return (
    <EventSelector
      selectedEvents={[selectedId]}
      eventList={availableEventIds}
      onEventClick={setSelectedId}
      hideAllButton
      onClearClick={() => setSelectedId(null)}
      showBreakBeforeButtons={false}
    />
  );
}

function SmartPicker({
  selectedId,
  setSelectedId,
  availableOptions,
  pickerComponent: PickerComponent,
  additionalPickerProps = {},
  children,
}) {
  const selectedOption = useMemo(
    () => availableOptions.find((opt) => opt.id === selectedId),
    [availableOptions, selectedId],
  );

  if (availableOptions.length === 1) {
    const defaultOption = availableOptions[0];

    return children(defaultOption);
  }

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <>
      <PickerComponent
        availableOptions={availableOptions}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        {...additionalPickerProps}
      />
      {selectedOption && (children(selectedOption))}
    </>
  );
}

export default function EventAndRoundPicker({
  pickerNavigation,
  navigatePicker,
  autoMatchSettings,
  uploadedScrambleFiles,
  matchState,
  dispatchMatchState,
}) {
  const navigatePickerEvent = useCallback(
    (eventId) => {
      navigatePicker('events', eventId);

      const newEvent = matchState.events.find((evt) => evt.id === eventId);

      if (newEvent !== undefined) {
        navigatePicker('rounds', newEvent.rounds[0]?.id);
      }
    },
    [matchState.events, navigatePicker],
  );

  return (
    <SmartPicker
      selectedId={pickerNavigation.events}
      setSelectedId={navigatePickerEvent}
      availableOptions={matchState.events}
      pickerComponent={EventPickerCompat}
    >
      {(selectedEvent) => (
        <InnerRoundPicker
          pickerNavigation={pickerNavigation}
          navigatePicker={navigatePicker}
          selectedEvent={selectedEvent}
          autoMatchSettings={autoMatchSettings}
          uploadedScrambleFiles={uploadedScrambleFiles}
          rootMatchState={matchState}
          dispatchMatchState={dispatchMatchState}
        />
      )}
    </SmartPicker>
  );
}

function InnerRoundPicker({
  pickerNavigation,
  navigatePicker,
  selectedEvent,
  autoMatchSettings,
  uploadedScrambleFiles,
  rootMatchState,
  dispatchMatchState,
}) {
  const navigatePickerRound = useCallback(
    (roundId) => navigatePicker('rounds', roundId),
    [navigatePicker],
  );

  return (
    <SmartPicker
      selectedId={pickerNavigation.rounds}
      setSelectedId={navigatePickerRound}
      availableOptions={selectedEvent.rounds}
      pickerComponent={RoundsButtonPicker}
      additionalPickerProps={{ selectedEvent }}
    >
      {(selectedRound) => (
        <DndWorkbench
          selectedEvent={selectedEvent}
          selectedRound={selectedRound}
          autoMatchSettings={autoMatchSettings}
          uploadedScrambleFiles={uploadedScrambleFiles}
          rootMatchState={rootMatchState}
          dispatchMatchState={dispatchMatchState}
        />
      )}
    </SmartPicker>
  );
}
