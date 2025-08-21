import _ from 'lodash';
import { moveArrayItem, applyPickerHistory } from './util';

function addScrambleSetsToEvents(wcifEvents, scrambleSets) {
  const groupedScrambleSets = _.groupBy(
    scrambleSets,
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
            ...(round.scrambleSets ?? []),
          ], 'id').map((scrSet) => ({
            ...scrSet,
            inbox_scrambles: _.sortBy(
              scrSet.inbox_scrambles,
              'ordered_index',
            ),
          })),
          'ordered_index',
        ),
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
    () => addScrambleSetsToEvents(wcifEvents, scrambleSets),
  );
}

function addScrambleFile(state, newScrambleFile) {
  return addScrambleSetsToEvents(state.events, newScrambleFile.inbox_scramble_sets);
}

function removeScrambleFile(state, oldScrambleFile) {
  return {
    ...state,
    events: state.events.map((wcifEvent) => ({
      ...wcifEvent,
      rounds: wcifEvent.rounds.map((round) => ({
        ...round,
        scrambleSets: round.scrambleSets.filter(
          (scrSet) => scrSet.external_upload_id !== oldScrambleFile.id,
        ),
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
        wcifEvents: state.initial.events,
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
          .update(newPath, (arr = []) => [...arr, action.entity])
          .value();
      });
    case 'reorderMatchingEntities':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(action, 'pickerHistory');

        const currentOrder = applyPickerHistory(subState, action.pickerHistory)[action.matchingKey];
        const movedItemState = moveArrayItem(currentOrder, action.fromIndex, action.toIndex);

        return _.chain(subState)
          .cloneDeep()
          .set(lodashPath, movedItemState)
          .value();
      });
    case 'deleteEntityFromMatching':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(action, 'pickerHistory');

        const currentList = applyPickerHistory(subState, action.pickerHistory)[action.matchingKey];
        const filteredItemState = currentList.filter((ent) => ent.id !== action.entity.id);

        return _.chain(subState)
          .cloneDeep()
          .set(lodashPath, filteredItemState)
          .value();
      });
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
