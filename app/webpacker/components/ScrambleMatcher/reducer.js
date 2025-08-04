import _ from 'lodash';
import { moveArrayItem } from './util';
import pickerConfigurations from './config';

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

function unfoldNavigation(pickerKey, accu = []) {
  const pickerConfig = pickerConfigurations.find((cfg) => cfg.key === pickerKey);

  if (!pickerConfig) {
    return accu;
  }

  const nextAccu = [...accu, {
    pickerKey,
    matchingKey: pickerConfig.matchingKey,
    entityId: null,
  }];

  return unfoldNavigation(pickerConfig.matchingKey, nextAccu);
}

export function initializeState({ wcifEvents, scrambleSets, navigationRootKey = undefined }) {
  return applyAction(
    { navigation: unfoldNavigation(navigationRootKey) },
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

export function translateNavigationToLodash(pickerHistory, initialLookup) {
  return pickerHistory.reduce((accu, historyStep) => {
    const selectedIndex = accu.lookup.findIndex((ent) => ent.id === pickerHistory.entityId);
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
      return {
        ...initializeState({
          wcifEvents: state.initial,
          scrambleSets: action.scrambleSets,
        }),
        navigation: state.navigation,
      };
    case 'navigatePicker':
      return applyAction(state, ['navigation'], (navState) => navState.map((nav) => (nav.pickerKey === action.pickerKey ? ({
        ...nav,
        entityId: action.newId,
      }) : nav)));
    case 'moveMatchingEntity':
      return applyAction(state, ['current'], (subState) => {
        const { path: oldPath } = translateNavigationToLodash(
          action.fromNavigation,
          subState,
        );

        const { path: newPath } = translateNavigationToLodash(
          action.toNavigation,
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
        const { path: lodashPath, lookup: currentOrder } = translateNavigationToLodash(
          action.localHistory,
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
