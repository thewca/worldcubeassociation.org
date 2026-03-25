import React, { useMemo, useState } from 'react';
import { Button, Header } from 'semantic-ui-react';
import EventSelector from '../wca/EventSelector';
import I18n from '../../lib/i18n';
import { localizeActivityCode } from '../../lib/utils/wcif';
import DndWorkbench from './DndWorkbench';

function ButtonPicker({
  availableOptions: availableRounds,
  selectedId,
  setSelectedId,
  selectedEvent,
}) {
  return (
    <>
      <Header as="h4">
        Round
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
            {localizeActivityCode(round.id, round, selectedEvent)}
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
  availableOptions,
  pickerComponent: PickerComponent,
  selectFirstByDefault = false,
  additionalPickerProps = {},
  children,
}) {
  const defaultValue = selectFirstByDefault ? availableOptions[0] : undefined;
  const [selectedId, setSelectedId] = useState(defaultValue?.id);

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
  uploadedScrambleFiles,
  matchState,
  dispatchMatchState,
}) {
  return (
    <SmartPicker
      availableOptions={matchState.events}
      pickerComponent={EventPickerCompat}
    >
      {(selectedEvent) => (
        <InnerRoundPicker
          key={selectedEvent.id}
          uploadedScrambleFiles={uploadedScrambleFiles}
          selectedEvent={selectedEvent}
          rootMatchState={matchState}
          dispatchMatchState={dispatchMatchState}
        />
      )}
    </SmartPicker>
  );
}

function InnerRoundPicker({
  selectedEvent,
  uploadedScrambleFiles,
  rootMatchState,
  dispatchMatchState,
}) {
  return (
    <SmartPicker
      availableOptions={selectedEvent.rounds}
      pickerComponent={ButtonPicker}
      selectFirstByDefault
      additionalPickerProps={{ selectedEvent }}
    >
      {(selectedRound) => (
        <DndWorkbench
          selectedEvent={selectedEvent}
          selectedRound={selectedRound}
          uploadedScrambleFiles={uploadedScrambleFiles}
          rootMatchState={rootMatchState}
          dispatchMatchState={dispatchMatchState}
        />
      )}
    </SmartPicker>
  );
}
