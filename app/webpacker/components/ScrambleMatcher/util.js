import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { competitionScrambleFilesUrl } from '../../lib/requests/routes.js.erb';
import { getRoundTypeId, parseActivityCode, shortLabelForActivityCode } from '../../lib/utils/wcif';
import I18n from '../../lib/i18n';

export const ATTEMPT_BASED_EVENTS = ['333fm', '333mbf'];

export const LEGAL_CROSS_MATCHES = [
  ['333', '333oh'],
];

export const DROPPABLE_ID_MATCHED_SCRAMBLES = 'matchedScrambles';
export const DROPPABLE_ID_STORAGE = 'storage';

export const prefixForIndex = (index) => {
  const char = String.fromCharCode(65 + (index % 26));
  if (index < 26) return char;

  return prefixForIndex(Math.floor(index / 26) - 1) + char;
};

export const scrambleSetToTitle = (scrambleSet) => {
  const eventName = I18n.t(`events.${scrambleSet.event_id}`);
  const roundNumberName = I18n.t('round.round_number', { round_number: scrambleSet.round_number });

  const eventAndRound = I18n.t('round.name', { event_name: eventName, round_name: roundNumberName });

  const letterCode = prefixForIndex(scrambleSet.scramble_set_number - 1);
  const scrambleSetName = I18n.t('scramble_set.name', { letter_code: letterCode });

  return `${eventAndRound} ${scrambleSetName}`;
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
