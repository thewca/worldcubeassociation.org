import _ from 'lodash';
import {
  addItemToArray,
  ATTEMPTS_UNPACKING_MARKER,
  autoMatchSearch,
  getAttemptsMultiplier,
  moveArrayItem,
  reconstructScrambleSet,
  removeItemFromArray,
  repackScrambleSet,
  searchRecursive,
  thinExtScramble,
  thinExtScrambleSet,
  thinWcifEvent,
  thinWcifRound,
  unpackScrambleSetsInRound,
} from './util';

function mergeMatchedSetsIntoWcif(wcifEvents, matchedScrambleSets) {
  const groupedScrambleSets = _.groupBy(
    matchedScrambleSets,
    'round_wcif_id',
  );

  return {
    events: wcifEvents.map((wcifEvent) => ({
      ...thinWcifEvent(wcifEvent),
      rounds: wcifEvent.rounds.map((wcifRound) => ({
        ...thinWcifRound(wcifRound),
        external_scramble_sets: _.sortBy(
          groupedScrambleSets[wcifRound.id] ?? [],
          'ordered_index',
        ).map((matchedScrSet) => ({
          ...thinExtScrambleSet(matchedScrSet.external_scramble_set),
          external_scrambles: _.sortBy(
            matchedScrSet.matched_scrambles,
            'ordered_index',
          ).map((matchedScramble) => ({
            ...thinExtScramble(matchedScramble.external_scramble),
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
  return {
    ...state,
    events: state.events.map((wcifEvent) => ({
      ...wcifEvent,
      rounds: wcifEvent.rounds.map((round) => {
        const flatScrambles = unpackScrambleSetsInRound(round.external_scramble_sets, true);

        const remainingScrambles = flatScrambles
          .filter((scr) => scr.scramble_file_upload_id !== oldScrambleFile.id);

        const remainingSets = round.external_scramble_sets
          .filter((scrSet) => scrSet.scramble_file_upload_id !== oldScrambleFile.id);

        const eligibleSets = [
          ...remainingSets,
          ...remainingScrambles.map((scr) => reconstructScrambleSet(scr)),
        ];

        const maxSetBracket = _.uniqBy(eligibleSets, 'id');

        const referenceLength = round.external_scramble_sets[0].external_scrambles.length;
        const chunkedScrambles = _.chunk(remainingScrambles, referenceLength);

        const filledBracket = maxSetBracket.map((set, idx) => ({
          ...set,
          external_scrambles: chunkedScrambles[idx] ?? [],
        }));

        const usedSetsInBracket = filledBracket
          .filter((set) => set.external_scrambles.length > 0)
          .map((set) => repackScrambleSet(set));

        return {
          ...round,
          external_scramble_sets: usedSetsInBracket,
        };
      }),
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
    external_scramble_sets: updateFn(rd.external_scramble_sets, rd),
  }));
}

function executeAddExternalToMatching(
  matchedState,
  eventId,
  roundId,
  externalScrambleSet,
  destinationIndex = undefined,
) {
  return updateMatchedSets(
    matchedState,
    eventId,
    roundId,
    (sets, round) => {
      if (externalScrambleSet[ATTEMPTS_UNPACKING_MARKER]) {
        const flatScrambles = unpackScrambleSetsInRound(sets, true);

        const scramblesWithAdded = addItemToArray(
          flatScrambles,
          externalScrambleSet,
          destinationIndex,
        );

        const eligibleSets = scramblesWithAdded.map((scr) => reconstructScrambleSet(scr));
        const maxSetBracket = _.uniqBy(eligibleSets, 'id');

        const referenceLength = getAttemptsMultiplier(round);
        const chunkedScrambles = _.chunk(scramblesWithAdded, referenceLength);

        const filledBracket = maxSetBracket.map((set, idx) => repackScrambleSet({
          ...set,
          external_scrambles: chunkedScrambles[idx] ?? [],
        }));

        return filledBracket
          .filter((set) => set.external_scrambles.length > 0);
      }

      return addItemToArray(
        sets,
        repackScrambleSet(externalScrambleSet),
        destinationIndex,
      );
    },
  );
}

function executeWithAttemptModeChunking(sets, updateFn, isAttemptMode = false) {
  if (isAttemptMode) {
    const flatScrambles = sets.flatMap((set) => set.external_scrambles);
    const filteredList = updateFn(flatScrambles);

    const referenceLength = sets[0].external_scrambles.length;
    const chunked = _.chunk(filteredList, referenceLength);

    return sets.map((set, idx) => ({
      ...set,
      external_scrambles: chunked[idx],
    }));
  }

  return updateFn(sets);
}

function executeRemoveFromMatching(
  matchedState,
  eventId,
  roundId,
  sourceIndex,
  isAttemptMode = false,
) {
  return updateMatchedSets(
    matchedState,
    eventId,
    roundId,
    (sets) => executeWithAttemptModeChunking(
      sets,
      (scrEntities) => removeItemFromArray(scrEntities, sourceIndex),
      isAttemptMode,
    ),
  );
}

function executeMoveInsideMatching(
  matchedState,
  eventId,
  roundId,
  sourceIndex,
  destinationIndex,
  isAttemptMode = false,
) {
  return updateMatchedSets(
    matchedState,
    eventId,
    roundId,
    (sets) => executeWithAttemptModeChunking(
      sets,
      (scrEntities) => moveArrayItem(
        scrEntities,
        sourceIndex,
        destinationIndex,
      ),
      isAttemptMode,
    ),
  );
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
    case 'resetRoundToInitial':
      return applyAction(state, ['current'], (subState) => updateMatchedSets(
        subState,
        action.eventId,
        action.roundId,
        () => {
          const initialRound = searchRecursive(
            state.initial,
            ['events', 'rounds'],
            action.roundId,
          )?.rounds?.item;

          return initialRound?.external_scramble_sets ?? [];
        },
      ));
    case 'autoMatchScrambleSets':
      return applyAction(
        state,
        ['current'],
        (subState) => action.scrambleSets.reduce((accuState, scrSet) => {
          const autoInsertNavigation = autoMatchSearch(scrSet, accuState, action.settings);

          if (autoInsertNavigation) {
            return executeAddExternalToMatching(
              accuState,
              autoInsertNavigation.events.id,
              autoInsertNavigation.rounds.id,
              scrSet,
            );
          }

          return accuState;
        }, subState),
      );
    case 'clearEntireMatching':
      return applyAction(state, ['current'], (subState) => mergeMatchedSetsIntoWcif(
        subState.events,
        [],
      ));
    case 'clearRoundMatching':
      return applyAction(state, ['current'], (subState) => updateMatchedSets(
        subState,
        action.eventId,
        action.roundId,
        () => [],
      ));
    case 'moveMatchedScrambleSet':
      return applyAction(state, ['current'], (subState) => {
        const removedSubState = executeRemoveFromMatching(
          subState,
          action.from.eventId,
          action.from.roundId,
          action.originalIndex,
          action.externalScrambleSet[ATTEMPTS_UNPACKING_MARKER],
        );

        return executeAddExternalToMatching(
          removedSubState,
          action.to.eventId,
          action.to.roundId,
          action.externalScrambleSet,
        );
      });
    case 'addExternalToMatching':
      return applyAction(state, ['current'], (subState) => executeAddExternalToMatching(
        subState,
        action.eventId,
        action.roundId,
        action.externalScrambleSet,
        action.destinationIndex,
      ));
    case 'moveInsideMatching':
      return applyAction(state, ['current'], (subState) => executeMoveInsideMatching(
        subState,
        action.eventId,
        action.roundId,
        action.sourceIndex,
        action.destinationIndex,
        action.isAttemptMode,
      ));
    case 'removeFromMatching':
      return applyAction(state, ['current'], (subState) => executeRemoveFromMatching(
        subState,
        action.eventId,
        action.roundId,
        action.sourceIndex,
        action.isAttemptMode,
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
