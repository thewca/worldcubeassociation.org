import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import MatchingTable from './MatchingTable';
import {
  DROPPABLE_ID_MATCHED_SCRAMBLES,
  DROPPABLE_ID_STORAGE,
} from './util';
import UnusedScramblesPanel from './UnusedScramblesPanel';
import { parseActivityCode } from '../../lib/utils/wcif';

export default function DndWorkbench({
  selectedEvent,
  selectedRound,
  autoMatchSettings,
  uploadedScrambleFiles,
  rootMatchState,
  dispatchMatchState,
}) {
  const matchingRows = selectedRound.external_scramble_sets;

  const uploadedScrambleSets = uploadedScrambleFiles
    .flatMap((scrFile) => scrFile.external_scramble_sets);

  const eligibleScrambleSets = uploadedScrambleSets
    .filter((set) => set.event_id === selectedEvent.id)
    .filter((set) => set.round_number === parseActivityCode(selectedRound.id).roundNumber);

  const unusedScrambleSets = eligibleScrambleSets
    .filter((extScrSet) => !matchingRows.some(
      (row) => row.id === extScrSet.id,
    ));

  const isAttemptMode = autoMatchSettings.useAttemptsMatching.includes(selectedEvent.id);

  const handleOnDragEnd = (result) => {
    const { source, destination } = result;

    if (destination) {
      if (destination.droppableId === DROPPABLE_ID_MATCHED_SCRAMBLES) {
        if (source.droppableId === DROPPABLE_ID_MATCHED_SCRAMBLES) {
          dispatchMatchState({
            type: 'moveInsideMatching',
            eventId: selectedEvent.id,
            roundId: selectedRound.id,
            sourceIndex: source.index,
            destinationIndex: destination.index,
          });
        } else if (source.droppableId === DROPPABLE_ID_STORAGE) {
          dispatchMatchState({
            type: 'addExternalToMatching',
            eventId: selectedEvent.id,
            roundId: selectedRound.id,
            destinationIndex: destination.index,
            externalScrambleSet: unusedScrambleSets[source.index],
          });
        }
      } else if (
        source.droppableId === DROPPABLE_ID_MATCHED_SCRAMBLES
          && destination.droppableId === DROPPABLE_ID_STORAGE
      ) {
        dispatchMatchState({
          type: 'removeFromMatching',
          eventId: selectedEvent.id,
          roundId: selectedRound.id,
          sourceIndex: source.index,
        });
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <UnusedScramblesPanel
        selectedEvent={selectedEvent}
        selectedRound={selectedRound}
        autoMatchSettings={autoMatchSettings}
        unusedScrambleSets={unusedScrambleSets}
        rootMatchState={rootMatchState}
        dispatchMatchState={dispatchMatchState}
      />
      <MatchingTable
        selectedEvent={selectedEvent}
        selectedRound={selectedRound}
        matchableRows={matchingRows}
        attemptMode={isAttemptMode}
        dispatchMatchState={dispatchMatchState}
      />
    </DragDropContext>
  );
}
