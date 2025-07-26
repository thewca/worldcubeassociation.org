import { useCallback } from 'react';
import _ from 'lodash';
import { moveArrayItem } from './util';

export function groupAndSortScrambles(scrambleSets) {
  const groupedScrambleSets = _.groupBy(
    scrambleSets,
    'matched_round_wcif_id',
  );

  return _.mapValues(
    groupedScrambleSets,
    (sets) => _.sortBy(sets, 'ordered_index')
      .map((set) => ({
        ...set,
        inbox_scrambles: _.sortBy(set.inbox_scrambles, 'ordered_index'),
      })),
  );
}

function applyAction(state, keys, action) {
  return keys.reduce((accState, key) => ({
    ...accState,
    [key]: action(state[key]),
  }), state);
}

export function initializeState(scrambleSets) {
  return applyAction(
    {},
    ['initial', 'current'],
    () => groupAndSortScrambles(scrambleSets),
  );
}

function mergeScrambleSets(sortedScramblesOld, sortedScramblesNew) {
  return _.mergeWith(
    sortedScramblesOld,
    sortedScramblesNew,
    (oldSets, newSets) => {
      const oldOrEmpty = oldSets ?? [];
      const newOrEmpty = newSets ?? [];

      const merged = [...oldOrEmpty, ...newOrEmpty];

      return _.uniqBy(merged, 'id');
    },
  );
}

function addScrambleFile(state, newScrambleFile) {
  const sortedFileScrambles = groupAndSortScrambles(newScrambleFile.inbox_scramble_sets);

  return mergeScrambleSets(state, sortedFileScrambles);
}

function removeScrambleFile(state, oldScrambleFile) {
  const withoutScrambleFile = _.mapValues(
    state,
    (sets) => sets.filter(
      (set) => set.external_upload_id !== oldScrambleFile.id,
    ),
  );

  // Throw away state entries for rounds that don't have any sets at all anymore
  return _.pickBy(withoutScrambleFile, (sets) => sets.length > 0);
}

export function useDispatchWrapper(originalDispatch, actionVars) {
  return useCallback((action) => {
    originalDispatch({
      ...actionVars,
      ...action,
    });
  }, [actionVars, originalDispatch]);
}

export default function scrambleMatchReducer(state, action) {
  switch (action.type) {
    case 'addScrambleFile':
      return applyAction(
        state,
        ['initial', 'current'],
        (subState) => addScrambleFile(subState, action.scrambleFile),
      );
    case 'removeScrambleFile':
      return applyAction(
        state,
        ['initial', 'current'],
        (subState) => removeScrambleFile(subState, action.scrambleFile),
      );
    case 'resetAfterSave':
      return initializeState(action.scrambleSets);
    case 'moveRoundScrambleSet':
      return applyAction(state, ['current'], (subState) => ({
        ...subState,
        [action.roundId]: moveArrayItem(
          subState[action.roundId],
          action.fromIndex,
          action.toIndex,
        ),
      }));
    case 'moveScrambleSetToRound':
      return applyAction(state, ['current'], (subState) => ({
        ...subState,
        [action.fromRoundId]: subState[action.fromRoundId].filter(
          (scrSet) => scrSet.id !== action.scrambleSet.id,
        ),
        [action.toRoundId]: [
          ...subState[action.toRoundId],
          { ...action.scrambleSet },
        ],
      }));
    case 'moveScrambleInSet':
      return applyAction(state, ['current'], (subState) => ({
        ...subState,
        [action.roundId]: subState[action.roundId]
          .map((scrSet, i) => (i === action.setNumber ? ({
            ...scrSet,
            inbox_scrambles: moveArrayItem(
              scrSet.inbox_scrambles,
              action.fromIndex,
              action.toIndex,
            ),
          }) : scrSet)),
      }));
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
