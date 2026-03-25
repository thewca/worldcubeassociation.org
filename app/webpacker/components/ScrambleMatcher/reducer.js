import _ from 'lodash';
import { addItemToArray, moveArrayItem, removeItemFromArray } from './util';

function addScrambleSetsToEvents(wcifEvents, convertedScrambleSets, keepExistingSets = true) {
  const groupedScrambleSets = _.groupBy(
    convertedScrambleSets,
    'round_wcif_id',
  );

  return {
    events: wcifEvents.map((wcifEvent) => ({
      ...wcifEvent,
      rounds: wcifEvent.rounds.map((wcifRound) => ({
        ...wcifRound,
        matchedScrambleSets: _.sortBy(
          _.uniqBy([
            // The order of lines is important here:
            //   Lodash keeps only the first appearance, so we need to list
            //   the newest possible entries first, followed by existing entries.
            ...(groupedScrambleSets[wcifRound.id] ?? []),
            ...(keepExistingSets ? (wcifRound.matchedScrambleSets ?? []) : []),
          ], 'id').map((scrSet) => ({
            ...scrSet,
            matchedScrambles: _.sortBy(
              scrSet.matchedScrambles,
              'orderedIndex',
            ),
          })),
          'orderedIndex',
        ),
        // we don't care about results in this UI at all,
        //   so deliberately un-setting them saves network bandwidth :)
        results: undefined,
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
  const convertedScrambleSets = matchedScrambleSets.map((scrSet) => ({
    ...scrSet,
    orderedIndex: scrSet.ordered_index,
    scrambleFileUploadId: scrSet.scramble_file_upload_id,
    externalScrambleSetId: scrSet.external_scramble_set_id,
    matchedScrambles: scrSet.matched_scrambles.map((scr) => ({
      ...scr,
      scrambleString: scr.scramble_string,
      isExtra: scr.is_extra,
      orderedIndex: scr.ordered_index,
      externalScrambleSetId: scrSet.external_scramble_set_id,
      externalScrambleId: scr.external_scramble_id,
    })),
  }));

  return applyAction(
    {},
    ['initial', 'current'],
    () => addScrambleSetsToEvents(wcifEvents, convertedScrambleSets, false),
  );
}

function addScrambleFile(state, newScrambleFile) {
  return addScrambleSetsToEvents(state.events, newScrambleFile.matched_scramble_sets);
}

function removeScrambleFile(state, oldScrambleFile) {
  const scrambleSets = state.events.flatMap(
    (evt) => evt.rounds.flatMap((rd) => rd.matchedScrambleSets),
  );

  const scrSetLookup = _.keyBy(scrambleSets, 'externalScrambleSetId');
  const setUploadLookup = _.mapValues(scrSetLookup, 'scrambleFileUploadId');

  return {
    ...state,
    events: state.events.map((wcifEvent) => ({
      ...wcifEvent,
      rounds: wcifEvent.rounds.map((round) => ({
        ...round,
        matchedScrambleSets: round.matchedScrambleSets.filter(
          (scrSet) => setUploadLookup[scrSet.externalScrambleSetId] !== oldScrambleFile.id,
        ).map((scrSet) => ({
          ...scrSet,
          matchedScrambles: scrSet.matchedScrambles.filter(
            (scr) => setUploadLookup[scr.externalScrambleSetId] !== oldScrambleFile.id,
          ),
        })),
      })),
    })),
  };
}

function updateMatchedSets(subState, eventId, roundId, updateFn) {
  return {
    ...subState,
    events: subState.events.map((evt) => (evt.id === eventId ? ({
      ...evt,
      rounds: evt.rounds.map((rd) => (rd.id === roundId ? ({
        ...rd,
        matchedScrambleSets: updateFn(rd.matchedScrambleSets),
      }) : rd)),
    }) : evt)),
  };
}

function mockMatchedSet(externalScrSet) {
  return {
    external_scramble_set_id: externalScrSet.id,
    external_scramble_set: externalScrSet,
  };
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
    case 'resetScrambleFile':
      return applyAction(
        state,
        ['current'],
        (subState) => removeScrambleFile(subState, action.scrambleFile),
      );
    case 'resetAfterSave':
      return initializeState({
        wcifEvents: state.current.events,
        matchedScrambleSets: action.scrambleSets,
      });
    case 'resetToInitial':
      return applyAction(state, ['current'], () => state.initial);
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
            mockMatchedSet(action.externalScrambleSet),
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
          mockMatchedSet(action.externalScrambleSet),
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
      return applyAction(state, ['current'], (subState) => ({
        ...subState,
        events: subState.events.map((evt) => (evt.id === action.eventId ? ({
          ...evt,
          rounds: evt.rounds.map((rd) => (rd.id === action.roundId ? ({
            ...rd,
            scrambleSetCount: action.scrambleSetCount,
          }) : rd)),
        }) : evt)),
      }));
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
