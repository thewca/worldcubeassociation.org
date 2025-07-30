import { useCallback } from 'react';
import _ from 'lodash';
import { moveArrayItem } from './util';

function addScrambleSetsToEvents(wcifEvents, scrambleSets) {
  const groupedScrambleSets = _.groupBy(
    scrambleSets,
    'matched_round_wcif_id',
  );

  return wcifEvents.map((wcifEvent) => ({
    ...wcifEvent,
    rounds: wcifEvent.rounds.map((round) => ({
      ...round,
      scrambleSets: _.uniqBy([
        ...(round.scrambleSets ?? []),
        ..._.sortBy(groupedScrambleSets[round.id], 'ordered_index')
          .map((scrSet) => ({
            ...scrSet,
            inbox_scrambles: _.sortBy(scrSet.inbox_scrambles, 'ordered_index'),
          })),
      ], 'id'),
    })),
  }));
}

function applyAction(state, keys, action) {
  return keys.reduce((accState, key) => ({
    ...accState,
    [key]: action(state[key]),
  }), state);
}

export function initializeState({ wcifEvents, scrambleSets }) {
  return applyAction(
    {},
    ['initial', 'current'],
    () => addScrambleSetsToEvents(wcifEvents, scrambleSets),
  );
}

function addScrambleFile(state, newScrambleFile) {
  return addScrambleSetsToEvents(state, newScrambleFile.inbox_scramble_sets);
}

function removeScrambleFile(state, oldScrambleFile) {
  return state.map((wcifEvent) => ({
    ...wcifEvent,
    rounds: wcifEvent.rounds.map((round) => ({
      ...round,
      scrambleSets: round.scrambleSets.filter(
        (scrSet) => scrSet.external_upload_id !== oldScrambleFile.id,
      ),
    })),
  }));
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
      return initializeState({
        wcifEvents: state,
        scrambleSets: action.scrambleSets,
      });
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
