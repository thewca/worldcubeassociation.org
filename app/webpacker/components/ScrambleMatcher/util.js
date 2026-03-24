import { events, formats } from '../../lib/wca-data.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { useQuery } from '@tanstack/react-query';
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

export const scrambleToName = (scramble) => `Scramble ${scramble.scramble_number}`;

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
