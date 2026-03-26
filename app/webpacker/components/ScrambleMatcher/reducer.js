import _ from 'lodash';
import {
  addItemToArray, autoMatchSearch, moveArrayItem, removeItemFromArray, searchRecursive,
} from './util';

function mergeMatchedSetsIntoWcif(wcifEvents, matchedScrambleSets) {
  const groupedScrambleSets = _.groupBy(
    matchedScrambleSets,
    'round_wcif_id',
  );

  return {
    events: wcifEvents.map((wcifEvent) => ({
      ...wcifEvent,
      rounds: wcifEvent.rounds.map((wcifRound) => ({
        ...wcifRound,
        external_scramble_sets: _.sortBy(
          groupedScrambleSets[wcifRound.id] ?? [],
          'ordered_index',
        ).map((matchedScrSet) => ({
          ...matchedScrSet.external_scramble_set,
          external_scrambles: _.sortBy(
            matchedScrSet.matched_scrambles,
            'ordered_index',
          ).map((matchedScramble) => ({
            ...matchedScramble.external_scramble,
            scramble_string: matchedScramble.scramble_string,
            is_extra: matchedScramble.is_extra,
          })),
        })),
      })),
    })),
  };
}

function applyAction(state, keys, action) {
  return keys.reduce((accState, key) => ({
    ...accState,
    [key]: action(state[key]),
  }), state);
}

export function initializeState({ wcifEvents, matchedScrambleSets }) {
  return applyAction(
    {},
    ['initial', 'current'],
    () => mergeMatchedSetsIntoWcif(wcifEvents, matchedScrambleSets),
  );
}

function removeScrambleFile(state, oldScrambleFile) {
  // TODO Pay attention to cross-matching: When dragging "split" attempts, you may have an attempt from set 2 in set 1. Set 1 should be deleted but...?!
  return {
    ...state,
    events: state.events.map((wcifEvent) => ({
      ...wcifEvent,
      rounds: wcifEvent.rounds.map((round) => ({
        ...round,
        external_scramble_sets: round.external_scramble_sets.filter(
          (scrSet) => scrSet.scramble_file_upload_id !== oldScrambleFile.id,
        ).map((scrSet) => ({
          ...scrSet,
          external_scrambles: scrSet.external_scrambles.filter(
            (scr) => scr.scramble_file_upload_id !== oldScrambleFile.id,
          ),
        })),
      })),
    })),
  };
}

function updateRound(subState, eventId, roundId, updateFn) {
  return {
    ...subState,
    events: subState.events.map((evt) => (evt.id === eventId ? ({
      ...evt,
      rounds: evt.rounds.map((rd) => (rd.id === roundId ? updateFn(rd) : rd)),
    }) : evt)),
  };
}

function updateMatchedSets(subState, eventId, roundId, updateFn) {
  return updateRound(subState, eventId, roundId, (rd) => ({
    ...rd,
    external_scramble_sets: updateFn(rd.external_scramble_sets),
  }));
}

export default function scrambleMatchReducer(state, action) {
  switch (action.type) {
    case 'removeScrambleFile':
      return applyAction(
        state,
        ['initial', 'current'],
        (subState) => removeScrambleFile(subState, action.scrambleFile),
      );
    case 'resetScrambleFile':
      return applyAction(
        state,
        ['current'],
        (subState) => removeScrambleFile(subState, action.scrambleFile),
      );
    case 'resetAfterSave':
      return initializeState({
        ...action,
        wcifEvents: state.current.events,
      });
    case 'resetToInitial':
      return applyAction(state, ['current'], () => state.initial);
    case 'autoMatchScrambleSets':
      return applyAction(
        state,
        ['current'],
        (subState) => action.scrambleSets.reduce((accuState, scrSet) => {
          const autoInsertNavigation = autoMatchSearch(scrSet, accuState, action.settings);

          if (autoInsertNavigation) {
            return updateMatchedSets(
              accuState,
              autoInsertNavigation.events.id,
              autoInsertNavigation.rounds.id,
              (sets) => addItemToArray(sets, scrSet),
            );
          }

          return accuState;
        }, subState),
      );
    case 'clearMatching':
      return applyAction(state, ['current'], (subState) => mergeMatchedSetsIntoWcif(
        subState.events,
        [],
      ));
    case 'moveMatchedScrambleSet':
      return applyAction(state, ['current'], (subState) => {
        const removedSubState = updateMatchedSets(
          subState,
          action.from.eventId,
          action.from.roundId,
          (sets) => removeItemFromArray(sets, action.originalIndex),
        );

        return updateMatchedSets(
          removedSubState,
          action.to.eventId,
          action.to.roundId,
          (sets) => addItemToArray(
            sets,
            action.externalScrambleSet,
          ),
        );
      });
    case 'addExternalToMatching':
      return applyAction(state, ['current'], (subState) => updateMatchedSets(
        subState,
        action.eventId,
        action.roundId,
        (sets) => addItemToArray(
          sets,
          action.externalScrambleSet,
          action.destinationIndex,
        ),
      ));
    case 'moveInsideMatching':
      return applyAction(state, ['current'], (subState) => updateMatchedSets(
        subState,
        action.eventId,
        action.roundId,
        (sets) => moveArrayItem(
          sets,
          action.sourceIndex,
          action.destinationIndex,
        ),
      ));
    case 'removeFromMatching':
      return applyAction(state, ['current'], (subState) => updateMatchedSets(
        subState,
        action.eventId,
        action.roundId,
        (sets) => removeItemFromArray(
          sets,
          action.sourceIndex,
        ),
      ));
    case 'updateScrambleSetCount':
      return applyAction(state, ['current'], (subState) => updateRound(
        subState,
        action.eventId,
        action.roundId,
        (rd) => ({
          ...rd,
          scrambleSetCount: action.scrambleSetCount,
        }),
      ));
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
