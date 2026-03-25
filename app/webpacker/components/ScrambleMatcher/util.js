import { useQuery } from '@tanstack/react-query';
import { events } from '../../lib/wca-data.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { competitionScrambleFilesUrl } from '../../lib/requests/routes.js.erb';

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

export const scrambleSetToName = (scrambleSet) => `Scramble Set ${prefixForIndex(scrambleSet.scramble_set_number - 1)}`;
export const scrambleSetToTitle = (scrambleSet) => `${events.byId[scrambleSet.event_id].name} Round ${scrambleSet.round_number} ${scrambleSetToName(scrambleSet)}`;

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

export const searchRecursive = (data, searchPath, targetId, targetKey = 'id', searchDescriptor = {}) => {
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
      if (item[targetKey] === targetId) {
        return nextHistory;
      }
    } else {
      return searchRecursive(item, remainingPath, targetId, targetKey, nextHistory);
    }

    return null;
  }, null);
};

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
