import _ from 'lodash';
import { events, formats } from '../../lib/wca-data.js.erb';
import { humanizeActivityCode } from '../../lib/utils/wcif';
import { EventsPickerCompat } from './ButtonGroupPicker';

export const ATTEMPT_BASED_EVENTS = ['333fm', '333mbf'];

export const LEGAL_CROSS_MATCHES = [
  ['333', '333oh'],
];

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
  matchedScrambleSets: {
    computeEntityName: (id, idx) => `Group ${idx + 1}`,
    headerLabel: 'Scramble Sets',
    dropdownLabel: 'Scramble Set',
    pickerLabel: 'Groups',
  },
  matchedScrambles: {
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
    matchingConfigKey: 'matchedScrambleSets',
    nestedPicker: 'matchedScrambleSets',
    pickFirstDefault: true,
  },
  matchedScrambleSets: {
    enabledCondition: (history) => isForAttemptBasedEvent(history),
    matchingConfigKey: 'matchedScrambles',
    pickFirstDefault: true,
  },
};

export const matchingDndConfig = {
  matchedScrambleSets: {
    computeCellName: scrambleSetToTitle,
    computeTableName: scrambleSetToName,
    computeCellDetails: (scrSet) => scrSet.original_filename,
    computeExpectedRowCount: (round) => round.scrambleSetCount,
    tableReferenceKey: 'scrambleSetCount',
  },
  matchedScrambles: {
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
      scrambleSets,
      'event_id',
    ),
    (eventItems) => _.groupBy(
      eventItems,
      'round_number',
    ),
  );

  const wcifEvents = _.sortBy(
    _.map(groupedMap, (roundsMap, eventId) => ({
      id: eventId,
      rounds: _.sortBy(
        _.map(roundsMap, (sets, roundNum) => ({
          id: `${eventId}-r${roundNum}`,
          roundNum,
          matchedScrambleSets: sets,
        })),
        'roundNum',
      ),
    })),
    (event) => events.byId[event.id].rank,
  );

  return { events: wcifEvents };
}

export function computeMatchingProgress(wcifEvents) {
  return wcifEvents.flatMap(
    (wcifEvent) => wcifEvent.rounds.map(
      (wcifRound, roundIdx) => {
        const formatExpectedSolveCount = formats.byId[wcifRound.format]?.expectedSolveCount;

        return {
          id: wcifRound.id,
          index: roundIdx,
          expected: wcifRound.scrambleSetCount,
          actual: wcifRound.matchedScrambleSets?.length ?? 0,
          scrambleSets: wcifRound.matchedScrambleSets?.map(
            (scrSet, setIdx) => ({
              id: scrSet.id,
              index: setIdx,
              expected: formatExpectedSolveCount,
              actual: scrSet.matchedScrambles?.length ?? 0,
            }),
          ),
        };
      },
    ),
  );
}
