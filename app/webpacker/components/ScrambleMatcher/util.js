import { useMemo } from 'react';
import { events, formats } from '../../lib/wca-data.js.erb';
import { humanizeActivityCode } from '../../lib/utils/wcif';
import { EventsPickerCompat } from './ButtonGroupPicker';

const ATTEMPT_BASED_EVENTS = ['333fm', '333mbf'];

export const pickerLocalizationConfig = {
  events: {
    computeEntityName: (evt) => events.byId[evt.id].name,
    headerLabel: 'Events',
    dropdownLabel: 'Event',
  },
  rounds: {
    computeEntityName: (rd) => humanizeActivityCode(rd.id),
    headerLabel: 'Rounds',
    dropdownLabel: 'Round',
  },
  scrambleSets: {
    computeEntityName: (scrSet, idx) => `Group ${idx + 1}`,
    headerLabel: 'Groups',
    dropdownLabel: 'Scramble Set',
  },
  inbox_scrambles: {
    computeEntityName: (scr, idx) => `Attempt ${idx + 1}`,
    headerLabel: 'Scrambles',
    dropdownLabel: 'Scramble',
  },
};

const prefixForIndex = (index) => {
  const char = String.fromCharCode(65 + (index % 26));
  if (index < 26) return char;

  return prefixForIndex(Math.floor(index / 26) - 1) + char;
};

export const scrambleSetToName = (scrambleSet) => `${events.byId[scrambleSet.event_id].name} Round ${scrambleSet.round_number} Scramble Set ${prefixForIndex(scrambleSet.scramble_set_number - 1)}`;

export const scrambleToName = (scramble) => `Scramble ${scramble.scramble_number}`;

const isForAttemptBasedEvent = (pickerHistory) => {
  const eventsStep = pickerHistory.find((step) => step.key === 'events');
  return ATTEMPT_BASED_EVENTS.includes(eventsStep.id);
};

const inferExpectedSolveCount = (pickerHistory) => {
  const roundsStep = pickerHistory.find((step) => step.key === 'rounds');
  return formats.byId[roundsStep.entity.format].expected_solve_count;
};

export const pickerStepConfig = {
  events: {
    pickerComponent: EventsPickerCompat,
    nestedPicker: 'rounds',
  },
  rounds: {
    matchingConfig: {
      key: 'scrambleSets',
      computeCellName: scrambleSetToName,
      computeCellDetails: (scrSet) => scrSet.original_filename,
      computeExpectedRowCount: (round) => round.scrambleSetCount,
    },
    nestedPicker: 'scrambleSets',
    nestingCondition: (history) => isForAttemptBasedEvent(history),
  },
  scrambleSets: {
    matchingConfig: {
      key: 'inbox_scrambles',
      computeCellName: scrambleToName,
      computeCellDetails: (scr) => scr.scramble_string,
      computeExpectedRowCount: (scrambleSet, history) => inferExpectedSolveCount(history),
    },
  },
};

export function moveArrayItem(arr, fromIndex, toIndex) {
  const movedItem = arr[fromIndex];

  const withoutMovedItem = [
    ...arr.slice(0, fromIndex),
    // here we want to ignore the moved item itself, so we need the +1
    ...arr.slice(fromIndex + 1),
  ];

  return [
    ...withoutMovedItem.slice(0, toIndex),
    movedItem,
    // here we do NOT want to ignore the items that were originally there, so no +1
    ...withoutMovedItem.slice(toIndex),
  ];
}

export function applyPickerHistory(rootState, pickerHistory) {
  return pickerHistory.reduce(
    (state, historyStep) => state[historyStep.key][historyStep.index],
    rootState,
  );
}

export function useHistoryEntry(pickerHistory, pickerKey) {
  return useMemo(
    () => pickerHistory.find((step) => step.key === pickerKey),
    [pickerHistory, pickerKey],
  );
}

export function computeMatchingProgress(wcifEvents) {
  return wcifEvents.flatMap(
    (wcifEvent) => wcifEvent.rounds.map(
      (wcifRound) => {
        const formatExpectedSolveCount = formats.byId[wcifRound.format]?.expected_solve_count;

        return {
          id: wcifRound.id,
          expected: wcifRound.scrambleSetCount,
          actual: wcifRound.scrambleSets?.length ?? 0,
          scrambleSets: wcifRound.scrambleSets?.map(
            (scrSet, idx) => ({
              id: scrSet.id,
              index: idx,
              expected: formatExpectedSolveCount,
              actual: scrSet.inbox_scrambles?.length ?? 0,
            }),
          ),
        };
      },
    ),
  );
}
