import _ from 'lodash';
import { events, formats } from '../../lib/wca-data.js.erb';

const prefixForIndex = (index) => {
  const char = String.fromCharCode(65 + (index % 26));
  if (index < 26) return char;

  return prefixForIndex(Math.floor(index / 26) - 1) + char;
};

export const scrambleSetToName = (scrambleSet) => `${events.byId[scrambleSet.event_id].name} Round ${scrambleSet.round_number} Scramble Set ${prefixForIndex(scrambleSet.scramble_set_number - 1)}`;

export const scrambleToName = (scramble) => `Scramble ${scramble.scramble_number} (${scramble.scramble_string})`;

export const scrambleSetToDetails = (scrambleSet) => {
  const [extraScr, standardScr] = _.partition(scrambleSet.inbox_scrambles, 'is_extra');

  const stdScrambleList = standardScr.map((scr) => scr.scramble_string).join('\n');

  if (extraScr.length > 0) {
    const extraScrambleList = extraScr.map((scr) => scr.scramble_string).join('\n');

    return [stdScrambleList, extraScrambleList].join('\n\n');
  }

  return stdScrambleList;
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
