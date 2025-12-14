import _ from 'lodash';
import { addItemToArray, moveArrayItem } from './util';

function addScrambleSetsToEvents(wcifEvents, scrambleSets, keepExistingSets = true) {
  const groupedScrambles = _.groupBy(
    scrambleSets.flatMap((scrSet) => scrSet.inbox_scrambles),
    'matched_scramble_set_id',
  );

  const groupedScrambleSets = _.groupBy(
    scrambleSets.map((scrSet) => ({
      ...scrSet,
      inbox_scrambles: groupedScrambles[scrSet.id],
    })),
    'matched_round_wcif_id',
  );

  return {
    events: wcifEvents.map((wcifEvent) => ({
      ...wcifEvent,
      rounds: wcifEvent.rounds.map((round) => ({
        ...round,
        scrambleSets: _.sortBy(
          _.uniqBy([
            // The order of lines is important here:
            //   Lodash keeps only the first appearance, so we need to list
            //   the newest possible entries first, followed by existing entries.
            ...(groupedScrambleSets[round.id] ?? []),
            ...(keepExistingSets ? (round.scrambleSets ?? []) : []),
          ], 'id').map((scrSet) => ({
            ...scrSet,
            inbox_scrambles: _.sortBy(
              scrSet.inbox_scrambles,
              'ordered_index',
            ),
          })),
          'ordered_index',
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

export function initializeState({ wcifEvents, scrambleSets }) {
  return applyAction(
    {},
    ['initial', 'current'],
    () => addScrambleSetsToEvents(wcifEvents, scrambleSets, false),
  );
}

function addScrambleFile(state, newScrambleFile) {
  return addScrambleSetsToEvents(state.events, newScrambleFile.inbox_scramble_sets);
}

function removeScrambleFile(state, oldScrambleFile) {
  const scrambleSets = state.events.flatMap((evt) => evt.rounds.flatMap((rd) => rd.scrambleSets));

  const scrSetLookup = _.keyBy(scrambleSets, 'id');
  const setUploadLookup = _.mapValues(scrSetLookup, 'external_upload_id');

  return {
    ...state,
    events: state.events.map((wcifEvent) => ({
      ...wcifEvent,
      rounds: wcifEvent.rounds.map((round) => ({
        ...round,
        scrambleSets: round.scrambleSets.filter(
          (scrSet) => setUploadLookup[scrSet.id] !== oldScrambleFile.id,
        ).map((scrSet) => ({
          ...scrSet,
          inbox_scrambles: scrSet.inbox_scrambles.filter(
            (ibs) => setUploadLookup[ibs.matched_scramble_set_id] !== oldScrambleFile.id,
          ),
        })),
      })),
    })),
  };
}

function navigationToLodash(actionWithNav, selector) {
  return [
    ...actionWithNav[selector].flatMap((step) => [step.key, step.index]),
    actionWithNav.matchingKey,
  ];
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
        wcifEvents: state.current.events,
        scrambleSets: action.scrambleSets,
      });
    case 'resetToInitial':
      return applyAction(state, ['current'], () => state.initial);
    case 'moveMatchingEntity':
      return applyAction(state, ['current'], (subState) => {
        const oldPath = navigationToLodash(action, 'fromNavigation');
        const newPath = navigationToLodash(action, 'toNavigation');

        return _.chain(subState)
          .cloneDeep()
          .update(oldPath, (arr) => arr.filter((ent) => ent.id !== action.entity.id))
          .update(newPath, (arr = []) => addItemToArray(arr, action.entity))
          .value();
      });
    case 'reorderMatchingEntities':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(action, 'pickerHistory');

        return _.chain(subState)
          .cloneDeep()
          .update(lodashPath, (arr = []) => moveArrayItem(arr, action.fromIndex, action.toIndex))
          .value();
      });
    case 'deleteEntityFromMatching':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(action, 'pickerHistory');

        return _.chain(subState)
          .cloneDeep()
          .update(lodashPath, (arr = []) => arr.filter((ent) => ent.id !== action.entity.id))
          .value();
      });
    case 'addEntityToMatching':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(action, 'pickerHistory');

        return _.chain(subState)
          .cloneDeep()
          .update(lodashPath, (arr = []) => addItemToArray(arr, action.entity, action.targetIndex))
          .value();
      });
    case 'updateReferenceValue':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(action, 'pickerHistory');

        return _.chain(subState)
          .cloneDeep()
          .set(lodashPath, action.value)
          .value();
      });
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
