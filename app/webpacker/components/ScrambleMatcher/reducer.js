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

export function translatePathToLodash(path, pickerHistory, initialLookup) {
  return pickerHistory.reduce((accu, historyStep) => {
    const idToSearch = path[historyStep.pickerKey];

    const selectedIndex = accu.lookup.findIndex((ent) => ent.id === idToSearch);
    const selectedEntity = accu.lookup[selectedIndex];

    return {
      path: [...accu.path, selectedIndex, historyStep.matchingKey],
      lookup: selectedEntity[historyStep.matchingKey],
    };
  }, {
    path: [],
    lookup: initialLookup,
  });
}

export function translateHistoryToPath(pickerHistory) {
  return pickerHistory.reduce((acc, historyStep) => ({
    ...acc,
    [historyStep.pickerKey]: historyStep.entity.id,
  }), {});
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
    case 'moveMatchingEntity':
      return applyAction(state, ['current'], (subState) => {
        const fromPath = translateHistoryToPath(action.pickerHistory);

        const { path: oldPath } = translatePathToLodash(
          fromPath,
          action.pickerHistory,
          subState,
        );

        const { path: newPath } = translatePathToLodash(
          action.targetPath,
          action.pickerHistory,
          subState,
        );

        return _.chain(subState)
          .cloneDeep()
          .update(oldPath, (arr) => arr.filter((ent) => ent.id !== action.entity.id))
          .update(newPath, (arr = []) => [...arr, action.entity])
          .value();
      });
    case 'reorderMatchingEntities':
      return applyAction(state, ['current'], (subState) => {
        const entityPath = translateHistoryToPath(action.pickerHistory);

        const { path: lodashPath, lookup: currentOrder } = translatePathToLodash(
          entityPath,
          action.pickerHistory,
          subState,
        );

        const movedItemState = moveArrayItem(currentOrder, action.fromIndex, action.toIndex);

        return _.chain(subState)
          .cloneDeep()
          .set(lodashPath, movedItemState)
          .value();
      });
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
