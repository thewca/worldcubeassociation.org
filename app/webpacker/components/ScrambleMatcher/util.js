import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { competitionScrambleFilesUrl } from '../../lib/requests/routes.js.erb';
import { getRoundTypeId, parseActivityCode, shortLabelForActivityCode } from '../../lib/utils/wcif';
import I18n from '../../lib/i18n';
import { events, formats } from '../../lib/wca-data.js.erb';

export const ATTEMPT_BASED_EVENTS = ['333fm', '333mbf'];

export const LEGAL_CROSS_MATCHES = [
  ['333', '333oh'],
];

export const DROPPABLE_ID_MATCHED_SCRAMBLES = 'matchedScrambles';
export const DROPPABLE_ID_STORAGE = 'storage';

export const AUTOMATCH_DEFAULT_SETTINGS = {
  limitMatches: true,
  tryBestInsert: false,
  useAttemptsMatching: ATTEMPT_BASED_EVENTS,
  fileTimestampPreference: 'uploaded_at',
};

export const ATTEMPTS_UNPACKING_MARKER = '_attemptsUnpacking';

export const prefixForIndex = (index) => {
  if (Number.isNaN(index)) {
    return 'NaN';
  }

  const char = String.fromCharCode(65 + (index % 26));
  if (index < 26) return char;

  return prefixForIndex(Math.floor(index / 26) - 1) + char;
};

export const getAttemptsMultiplier = (round) => formats.byId[round.format].expectedSolveCount;

export const scrambleSetToTitle = (scrambleSet) => {
  const eventName = I18n.t(`events.${scrambleSet.event_id}`);
  const roundNumberName = I18n.t('round.round_number', { round_number: scrambleSet.round_number });

  const eventAndRound = I18n.t('round.name', { event_name: eventName, round_name: roundNumberName });

  const letterCode = prefixForIndex(scrambleSet.scramble_set_number - 1);
  const scrambleSetName = I18n.t('scramble_set.name', { letter_code: letterCode });

  const setTitle = `${eventAndRound} ${scrambleSetName}`;

  if (scrambleSet[ATTEMPTS_UNPACKING_MARKER]) {
    const attemptName = I18n.t('scramble_set.attempt', { number: scrambleSet.scramble_number });

    return `${setTitle} ${attemptName}`;
  }

  return setTitle;
};

export const roundToRoundTypeName = (wcifRound, wcifEvent, suffix = false) => {
  const { roundNumber } = parseActivityCode(wcifRound.id);

  const roundTypeId = getRoundTypeId(
    roundNumber,
    wcifEvent.rounds.length,
    Boolean(wcifRound.cutoff),
  );

  const roundTypeName = I18n.t(`rounds.${roundTypeId}.name`);

  if (suffix) {
    return `${roundTypeName} (${shortLabelForActivityCode(wcifRound.id)})`;
  }

  return roundTypeName;
};

export function removeItemFromArray(arr, indexToRemove) {
  return [
    ...arr.slice(0, indexToRemove),
    ...arr.slice(indexToRemove + 1),
  ];
}

export function addItemToArray(arr, entity, targetIdx = arr.length) {
  return arr.toSpliced(targetIdx, 0, entity);
}

export function moveArrayItem(arr, fromIndex, toIndex) {
  const movedItem = arr[fromIndex];

  const withoutMovedItem = removeItemFromArray(arr, fromIndex);
  return addItemToArray(withoutMovedItem, movedItem, toIndex);
}

export const searchRecursive = (data, searchPath, targetId, searchDescriptor = {}) => {
  const [currentKey, ...remainingPath] = searchPath;

  return data[currentKey]?.reduce((foundPath, item, index) => {
    if (foundPath) return foundPath;

    const nextHistory = {
      ...searchDescriptor,
      [currentKey]: {
        id: item.id,
        item,
        index,
      },
    };

    if (remainingPath.length === 0) {
      if (item.id === targetId) {
        return nextHistory;
      }
    } else {
      return searchRecursive(item, remainingPath, targetId, nextHistory);
    }

    return null;
  }, null);
};

export function thinWcifEvent(wcifEvent) {
  return _.pick(wcifEvent, 'id');
}

export function thinWcifRound(wcifRound) {
  return _.pick(wcifRound, 'id', 'format', 'scrambleSetCount');
}

export function thinExtScrambleSet(extScrSet) {
  return _.pick(extScrSet, 'id', 'event_id', 'scramble_file_upload_id', 'round_number', 'scramble_set_number', 'original_filename', 'generated_at', 'uploaded_at', 'automatch_wcif_id');
}

export function thinExtScramble(extScr) {
  return _.pick(extScr, 'id', 'is_extra', 'scramble_number', 'scramble_string');
}

function unpackExternalScrambleSet(extScrSet, isAttemptMode) {
  const thinnedScrambleSet = thinExtScrambleSet(extScrSet);

  if (isAttemptMode) {
    return extScrSet.external_scrambles
      .map((extScr) => {
        const thinnedScramble = thinExtScramble(extScr);

        return ({
          ...thinnedScrambleSet,
          ...thinnedScramble,
          [ATTEMPTS_UNPACKING_MARKER]: thinnedScrambleSet.id,
        });
      });
  }

  const repackedScrambleSet = {
    ...thinnedScrambleSet,
    external_scrambles: _.sortBy(
      extScrSet.external_scrambles,
      ['is_extra', 'scramble_number'],
    ).map((extScr) => thinExtScramble(extScr)),
  };

  return [repackedScrambleSet];
}

export function unpackScrambleSets(extScrambleSets, autoMatchSettings) {
  return extScrambleSets.flatMap((extScrSet) => {
    const isAttemptMode = autoMatchSettings.useAttemptsMatching.includes(extScrSet.event_id);

    return unpackExternalScrambleSet(extScrSet, isAttemptMode);
  });
}

export function unpackScrambleSetsInRound(extScrambleSets, isAttemptMode) {
  return extScrambleSets.flatMap(
    (extScrSet) => unpackExternalScrambleSet(extScrSet, isAttemptMode),
  );
}

export const calculateRoundExpectedCount = (
  round,
  isAttemptMode = false,
) => round.scrambleSetCount * (isAttemptMode ? getAttemptsMultiplier(round) : 1);

export const calculateRoundMatchedCount = (
  round,
  isAttemptMode = false,
) => unpackScrambleSetsInRound(round.external_scramble_sets, isAttemptMode).length;

export function autoMatchSearch(
  scrSet,
  wcifEvents,
  autoMatchSettings = AUTOMATCH_DEFAULT_SETTINGS,
) {
  const autoMatchNavigation = searchRecursive(
    wcifEvents,
    ['events', 'rounds'],
    scrSet.automatch_wcif_id,
  );

  if (autoMatchNavigation) {
    const targetRound = autoMatchNavigation.rounds.item;
    const isAttemptMode = autoMatchSettings.useAttemptsMatching
      .includes(autoMatchNavigation.events.id);

    const matchingProgress = calculateRoundMatchedCount(targetRound, isAttemptMode);
    const matchingTarget = calculateRoundExpectedCount(targetRound, isAttemptMode);

    if (
      !autoMatchSettings.limitMatches || matchingProgress < matchingTarget
    ) {
      return autoMatchNavigation;
    }
  }

  return null;
}

export function sortSetsForAutoMatch(scrSets, autoMatchSettings) {
  return _.sortBy(scrSets, [
    (scrSet) => DateTime.fromISO(
      scrSet[autoMatchSettings.fileTimestampPreference],
    ).toUnixInteger(),
    (scrSet) => events.byId[scrSet.event_id].rank,
    'round_number',
    'scramble_set_number',
    'scramble_number',
  ]);
}

export function filterUnusedScrambles(
  scrFileSets,
  matchedStateSets,
  autoMatchSettings,
) {
  const unusedScrambleSets = _.differenceWith(
    scrFileSets,
    matchedStateSets,
    (a, b) => {
      const miniA = _.pick(a, [ATTEMPTS_UNPACKING_MARKER, 'id']);
      const miniB = _.pick(b, [ATTEMPTS_UNPACKING_MARKER, 'id']);

      return _.isEqual(miniA, miniB);
    },
  );

  return sortSetsForAutoMatch(unusedScrambleSets, autoMatchSettings);
}

export function useConfigState(defaultConfig = {}) {
  const [internalConfig, setInternalConfig] = useState(defaultConfig);

  const changeConfigItem = useCallback((key, newValue) => {
    setInternalConfig((currentConfig) => ({
      ...currentConfig,
      [key]: newValue,
    }));
  }, [setInternalConfig]);

  return [internalConfig, changeConfigItem];
}

async function listScrambleFiles(competitionId) {
  const { data } = await fetchJsonOrError(competitionScrambleFilesUrl(competitionId));

  return data;
}

export function useScrambleFilesQuery(competitionId, initialScrambleFiles = undefined) {
  return useQuery({
    queryKey: ['scramble-files', competitionId],
    queryFn: () => listScrambleFiles(competitionId),
    initialData: initialScrambleFiles,
    refetchOnMount: false,
  });
}
