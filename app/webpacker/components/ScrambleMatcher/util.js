import _ from 'lodash';
import { events, formats } from '../../lib/wca-data.js.erb';
import { humanizeActivityCode } from '../../lib/utils/wcif';
import { EventsPickerCompat } from './ButtonGroupPicker';

export const ATTEMPT_BASED_EVENTS = ['333fm', '333mbf'];

export const pickerLocalizationConfig = {
  events: {
    computeEntityName: (id) => events.byId[id].name,
    headerLabel: 'Events',
    dropdownLabel: 'Event',
  },
  rounds: {
    computeEntityName: (id) => humanizeActivityCode(id),
    headerLabel: 'Rounds',
    dropdownLabel: 'Round',
  },
  scrambleSets: {
    computeEntityName: (id, idx) => `Group ${idx + 1}`,
    headerLabel: 'Scramble Sets',
    dropdownLabel: 'Scramble Set',
    pickerLabel: 'Groups',
  },
  inbox_scrambles: {
    computeEntityName: (id, idx) => `Attempt ${idx + 1}`,
    headerLabel: 'Scrambles',
    dropdownLabel: 'Scramble',
  },
};

const prefixForIndex = (index) => {
  const char = String.fromCharCode(65 + (index % 26));
  if (index < 26) return char;

  return prefixForIndex(Math.floor(index / 26) - 1) + char;
};

export const scrambleSetToName = (scrambleSet) => `Scramble Set ${prefixForIndex(scrambleSet.scramble_set_number - 1)}`;
const scrambleSetToTitle = (scrambleSet) => `${events.byId[scrambleSet.event_id].name} Round ${scrambleSet.round_number} ${scrambleSetToName(scrambleSet)}`;

export const scrambleToName = (scramble) => `Scramble ${scramble.scramble_number}`;

export const isForAttemptBasedEvent = (pickerHistory) => {
  const eventsStep = pickerHistory.find((step) => step.key === 'events');
  return ATTEMPT_BASED_EVENTS.includes(eventsStep.id);
};

const inferExpectedSolveCount = (pickerHistory) => {
  const roundsStep = pickerHistory.find((step) => step.key === 'rounds');
  return formats.byId[roundsStep.entity.format].expectedSolveCount;
};

export const pickerStepConfig = {
  events: {
    pickerComponent: EventsPickerCompat,
    nestedPicker: 'rounds',
  },
  rounds: {
    matchingConfigKey: 'scrambleSets',
    nestedPicker: 'scrambleSets',
  },
  scrambleSets: {
    enabledCondition: (history) => isForAttemptBasedEvent(history),
    matchingConfigKey: 'inbox_scrambles',
  },
};

export const matchingDndConfig = {
  scrambleSets: {
    computeCellName: scrambleSetToTitle,
    computeTableName: scrambleSetToName,
    computeCellDetails: (scrSet) => scrSet.original_filename,
    computeExpectedRowCount: (round) => round.scrambleSetCount,
  },
  inbox_scrambles: {
    computeCellName: scrambleToName,
    computeCellDetails: (scr) => scr.scramble_string,
    cellDetailsAreData: true,
    computeExpectedRowCount: (scrambleSet, history) => inferExpectedSolveCount(history),
  },
};

export function buildHistoryStep(key, entity, index) {
  return {
    key,
    entity,
    id: entity.id,
    index,
  };
}

export function moveArrayItem(arr, fromIndex, toIndex) {
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

export function addItemToArray(arr, entity, targetIdx = arr.length) {
  return arr.toSpliced(targetIdx, 0, entity);
}

export const searchRecursive = (data, targetStep, currentKey = 'events', searchHistory = []) => {
  const { nestedPicker, matchingConfigKey = nestedPicker } = pickerStepConfig[currentKey] || {};

  return data[currentKey]?.reduce((foundPath, item, index) => {
    if (foundPath) return foundPath;

    const nextHistory = [
      ...searchHistory,
      buildHistoryStep(currentKey, item, index),
    ];

    if (currentKey === targetStep.key && item.id === targetStep.id) {
      return nextHistory;
    }

    if (matchingConfigKey) {
      return searchRecursive(item, targetStep, matchingConfigKey, nextHistory);
    }

    return null;
  }, null);
};

export function groupScrambleSetsIntoWcif(scrambleSets) {
  const groupedMap = _.mapValues(
    _.groupBy(
      _.sortBy(scrambleSets, (scrSet) => events.byId[scrSet.event_id].rank),
      'event_id',
    ),
    (eventItems) => _.groupBy(
      _.sortBy(eventItems, (evt) => evt.round_number),
      'round_number',
    ),
  );

  const wcifEvents = _.map(groupedMap, (roundsMap, eventId) => ({
    id: eventId,
    rounds: _.map(roundsMap, (sets, roundNum) => ({
      id: `${eventId}-r${roundNum}`,
      scrambleSets: sets,
    })),
  }));

  return { events: wcifEvents };
}

export function computeMatchingProgress(wcifEvents) {
  return wcifEvents.flatMap(
    (wcifEvent) => wcifEvent.rounds.map(
      (wcifRound) => {
        const formatExpectedSolveCount = formats.byId[wcifRound.format]?.expectedSolveCount;

        return {
          id: wcifRound.id,
          expected: wcifRound.scrambleSetCount,
          actual: wcifRound.scrambleSets?.length ?? 0,
          scrambleSets: wcifRound.scrambleSets?.map(
            (scrSet, idx) => ({
              id: scrSet.id,
              index: idx,
              expected: formatExpectedSolveCount,
              actual: scrSet.inbox_scrambles?.length ?? 0,
            }),
          ),
        };
      },
    ),
  );
}
