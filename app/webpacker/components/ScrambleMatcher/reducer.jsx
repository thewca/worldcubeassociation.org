import { useCallback } from 'react';
import _ from 'lodash';

export function mergeScrambleSets(state, newScrambleFile) {
  const groupedScrambleSets = _.groupBy(
    newScrambleFile.inbox_scramble_sets,
    'matched_round_wcif_id',
  );

  const orderedScrambleSets = _.mapValues(
    groupedScrambleSets,
    (sets) => _.sortBy(sets, 'ordered_index')
      .map((set) => ({
        ...set,
        inbox_scrambles: _.sortBy(set.inbox_scrambles, 'ordered_index'),
      })),
  );

  return _.mergeWith(
    orderedScrambleSets,
    state,
    (a, b) => {
      const aOrEmpty = a ?? [];
      const bOrEmpty = b ?? [];

      const merged = [...bOrEmpty, ...aOrEmpty];

      return _.uniqBy(merged, 'id');
    },
  );
}

function removeScrambleSet(state, oldScrambleFile) {
  const withoutScrambleFile = _.mapValues(
    state,
    (sets) => sets.filter(
      (set) => set.external_upload_id !== oldScrambleFile.id,
    ),
  );

  // Throw away state entries for rounds that don't have any sets at all anymore
  return _.pickBy(withoutScrambleFile, (sets) => sets.length > 0);
}

function moveArrayItem(arr, fromIndex, toIndex) {
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
      return mergeScrambleSets(state, action.scrambleFile);
    case 'removeScrambleFile':
      return removeScrambleSet(state, action.scrambleFile);
    case 'moveRoundScrambleSet':
      return {
        ...state,
        [action.roundId]: moveArrayItem(
          state[action.roundId],
          action.fromIndex,
          action.toIndex,
        ),
      };
    case 'moveScrambleInSet':
      return {
        ...state,
        [action.roundId]: state[action.roundId]
          .map((scrSet, i) => (i === action.setNumber ? ({
            ...scrSet,
            inbox_scrambles: moveArrayItem(
              scrSet.inbox_scrambles,
              action.fromIndex,
              action.toIndex,
            ),
          }) : scrSet)),
      };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
