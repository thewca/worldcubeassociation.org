import _ from 'lodash';
import { addItemToArray, moveArrayItem } from './util';

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

function navigationToLodash(rootState, actionWithNav, selector) {
  const history = actionWithNav[selector];

  const navigation = history.reduce((navAccu, historyStep) => {
    const searchSubject = navAccu.lookupState[historyStep.key];

    if (searchSubject === undefined) {
      return {
        lookupState: {},
        accu: undefined,
      };
    }

    const targetIndex = searchSubject.findIndex((ent) => ent.id === historyStep.id);

    return {
      lookupState: searchSubject[targetIndex],
      accu: [...navAccu.accu, historyStep.key, targetIndex],
    };
  }, {
    lookupState: rootState,
    accu: [],
  });

  if (navigation.accu !== undefined) {
    return [
      ...navigation.accu,
      actionWithNav.matchingKey,
    ];
  }

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
    case 'resetScrambleFile':
      return applyAction(
        state,
        ['current'],
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
        const oldPath = navigationToLodash(subState, action, 'fromNavigation');
        const newPath = navigationToLodash(subState, action, 'toNavigation');

        return _.chain(subState)
          .cloneDeep()
          .update(oldPath, (arr) => arr.filter((ent) => ent.id !== action.entity.id))
          .update(newPath, (arr = []) => addItemToArray(arr, action.entity))
          .value();
      });
    case 'reorderMatchingEntities':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(subState, action, 'pickerHistory');

        return _.chain(subState)
          .cloneDeep()
          .update(lodashPath, (arr = []) => moveArrayItem(arr, action.fromIndex, action.toIndex))
          .value();
      });
    case 'deleteEntityFromMatching':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(subState, action, 'pickerHistory');

        return _.chain(subState)
          .cloneDeep()
          .update(lodashPath, (arr = []) => arr.filter((ent) => ent.id !== action.entity.id))
          .value();
      });
    case 'addEntityToMatching':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(subState, action, 'pickerHistory');

        return _.chain(subState)
          .cloneDeep()
          .update(lodashPath, (arr = []) => addItemToArray(arr, action.entity, action.targetIndex))
          .value();
      });
    case 'updateReferenceValue':
      return applyAction(state, ['current'], (subState) => {
        const lodashPath = navigationToLodash(subState, action, 'pickerHistory');

        return _.chain(subState)
          .cloneDeep()
          .set(lodashPath, action.value)
          .value();
      });
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
