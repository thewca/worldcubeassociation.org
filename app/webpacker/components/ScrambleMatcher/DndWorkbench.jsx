import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import MatchingTable from './MatchingTable';
import {
  ATTEMPT_BASED_EVENTS,
  DROPPABLE_ID_MATCHED_SCRAMBLES,
  DROPPABLE_ID_STORAGE,
  LEGAL_CROSS_MATCHES,
} from './util';
import UnusedScramblesPanel from './UnusedScramblesPanel';
import { parseActivityCode } from '../../lib/utils/wcif';

export default function DndWorkbench({
  selectedEvent,
  selectedRound,
  uploadedScrambleFiles,
  dispatchMatchState,
}) {
  const matchingRows = selectedRound.matchedScrambleSets;

  const uploadedScrambleSets = uploadedScrambleFiles
    .flatMap((scrFile) => scrFile.external_scramble_sets);

  const eligibleEventIds = LEGAL_CROSS_MATCHES
    .find((crossMatches) => crossMatches.includes(selectedEvent.id)) ?? [selectedEvent.id];

  const eligibleScrambleSets = uploadedScrambleSets
    .filter((set) => eligibleEventIds.includes(set.event_id))
    .filter((set) => set.round_number === parseActivityCode(selectedRound.id).roundNumber);

  const unusedScrambleSets = eligibleScrambleSets
    .filter((extScrSet) => !matchingRows.some(
      (row) => row.external_scramble_set.id === extScrSet.id,
    ));

  const isAttemptMode = ATTEMPT_BASED_EVENTS.includes(selectedEvent.id);

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
        unusedScrambleSets={unusedScrambleSets}
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
