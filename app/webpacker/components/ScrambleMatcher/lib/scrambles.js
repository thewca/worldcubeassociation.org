import { parseActivityCode } from '@wca/helpers';
import { events, formats } from '../../../lib/wca-data.js.erb';

const updateArrayInplace = (arr, index, newElem) => {
  arr[index] = newElem;
  return arr;
};

const updateIn = (object, [property, ...properyChain], updater) => (properyChain.length === 0
  ? Number.isInteger(property)
    ? updateArrayInplace(object, property, updater(object[property]))
    : { ...object, [property]: updater(object[property]) }
  : Number.isInteger(property)
    ? updateArrayInplace(
      object,
      property,
      updateIn(object[property], properyChain, updater),
    )
    : {
      ...object,
      [property]: updateIn(object[property], properyChain, updater),
    });

export const flatMap = (arr, fn) => arr.reduce((xs, x) => xs.concat(fn(x)), []);

// 65 is the char code for 'A'
export const prefixForIndex = (index) => {
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }
  return (
    prefixForIndex(Math.floor(index / 26) - 1)
    + String.fromCharCode(65 + (index % 26))
  );
};

export const wcifScrambleToInternal = (
  eventId,
  roundNumber,
  sheetName,
  set,
  index,
  incrementScrambleSetId,
) => ({
  id: incrementScrambleSetId,
  scrambles: set.scrambles || [],
  extraScrambles: set.extraScrambles || [],
  title: `${events.byId[
    eventId
  ].name} - Round ${roundNumber} - Set ${prefixForIndex(index)}`,
  sheetName,
  eventId,
  roundNumber,
});

const sortCompare = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

export const sortBy = (arr, fn) => arr.slice().sort((x, y) => sortCompare(fn(x), fn(y)));

export const sortWcifEvents = (wcifEvents) => sortBy(
  wcifEvents,
  (wcifEvent) => events.official.findIndex((event) => event.id === wcifEvent.id),
);

export const splitMultiFmAsWcif = (set, incrementScrambleSetId) =>
  // Split the scramble to have one object per attempt (will be useful later ;))
  set.scrambles.map((sequence, attemptNumber) => ({
    ...set,
    id: incrementScrambleSetId,
    scrambles: [sequence],
    title: `${set.title} Attempt ${attemptNumber + 1}`,
    attemptNumber: attemptNumber + 1,
    generatedAttemptNumber: attemptNumber + 1,
  }));
export const importWcif = (
  wcif,
  uniqueScrambleUploadedId,
  incrementScrambleSetId,
) => {
  // Perform a few changes such as sorting the events, and extracting scrambles
  // sheets.

  wcif = updateIn(wcif, ['events'], sortWcifEvents);

  const scrambleSheet = {
    id: uniqueScrambleUploadedId,
    competitionName: `${uniqueScrambleUploadedId}: Scrambles for ${wcif.name}`,
    generationUrl: 'unknown',
    generationDate: 'unknown',
    version: 'unknown',
    sheets: [],
  };

  wcif = {
    ...wcif,
    events: wcif.events.map((e) => ({
      ...e,
      rounds: e.rounds.map((r) => {
        const sheets = (r.scrambleSets || []).map((set, index) => {
          let internalSet = wcifScrambleToInternal(
            e.id,
            parseActivityCode(r.id).roundNumber,
            scrambleSheet.competitionName,
            set,
            index,
            incrementScrambleSetId,
          );
          if (['333fm', '333mbf'].includes(e.id)) {
            internalSet = splitMultiFmAsWcif(internalSet, incrementScrambleSetId);
            scrambleSheet.sheets.push(...internalSet);
          } else {
            scrambleSheet.sheets.push(internalSet);
          }
          return internalSet;
        });
        return {
          ...r,
          scrambleSets: flatMap(sheets, (s) => s),
        };
      }),
    })),
  };
  const extractedSheets = [];
  if (scrambleSheet.sheets.length !== 0) {
    extractedSheets.push(scrambleSheet);
  }

  // Return an element to add to "uploadedscrambles", and the processed wcif.
  return [wcif, extractedSheets];
};

export const transformUploadedScrambles = (
  uploadedJson,
  uniqueScrambleUploadedId,
  incrementScrambleSetId,
) => {
  const tnoodleWcif = uploadedJson.wcif;
  const [, extractedScrambles] = importWcif(
    tnoodleWcif,
    uniqueScrambleUploadedId,
    incrementScrambleSetId,
  );
  delete uploadedJson.wcif; // avoid confusion with the other WCIF that gets merged in
  uploadedJson.sheets = extractedScrambles.flatMap(
    (sheetExt) => sheetExt.sheets,
  );
  return uploadedJson;
};

// export const updateMultiAndFm = (scrambles) => flatMap(scrambles, (s) => (s.event === '333fm' || s.event === '333mbf' ? splitMultiFm(s) : s));

export const usedScramblesIdsForEvent = (wcifEvents, eventId) => flatMap(
  flatMap(
    wcifEvents.filter((e) => e.id === eventId),
    (e) => flatMap(e.rounds, (r) => r.scrambleSets),
  ),
  (s) => s.id,
);

const scrambleSetsForRound = (usedScramblesId, round, uploadedScrambles) => {
  // We don't want to overwrite existing scrambles,
  // so for all rounds *without* scramble we:
  //   - for all scramble in uploadedScrambles (in order they were uploaded):
  //     - look for a set of matching (event, round number)
  // This way if we ever upload multiple sets of scramble for the same round
  // we just assign the first one (as the others are likely extra scrambles used
  // in rounds we can't figure out programatically !).
  // We also want to return a new WCIF as the wcif passed is most likely taken
  // from a React state.
  const { eventId, roundNumber } = parseActivityCode(round.id);
  let firstMatchingSheets = [];
  uploadedScrambles.find((up) => {
    firstMatchingSheets = up.sheets.filter(
      (s) => !usedScramblesId.includes(s.id)
        && s.eventId === eventId
        && s.roundNumber === roundNumber,
    );
    return firstMatchingSheets.length !== 0;
  });
  // We don't need to update the usedScramblesId, because we never try to
  // get the same eventId/roundNumber again, so usedScramblesId only need to
  // contain the scrambles in use before the autoAssign thing.
  if (['333fm', '333mbf'].includes(eventId)) {
    // Select scrambles which match the attempt number(s) expected,
    // and assign the attemptNumber from the generated number
    const numberOfAttempts = formats.byId[round.format].solveCount;
    return firstMatchingSheets
      .filter((s) => s.generatedAttemptNumber <= numberOfAttempts)
      .slice(0, round.scrambleSetCount * numberOfAttempts)
      .map((s) => ({
        ...s,
        attemptNumber: s.generatedAttemptNumber,
      }));
  }
  // Only auto-assign up to scrambleSetCount sets of scrambles.
  return firstMatchingSheets.slice(0, round.scrambleSetCount);
};

export const autoAssignScrambles = (eventWcif, uploadedScrambles) => {
  const usedScrambleIdsByEvent = {};
  eventWcif.forEach((e) => {
    usedScrambleIdsByEvent[e.id] = usedScramblesIdsForEvent(eventWcif.events, e.id);
  });
  return {
    events: eventWcif.events.map((e) => ({
      ...e,
      rounds: e.rounds.map((r) => ({
        ...r,
        scrambleSets:
          r.scrambleSets.length === 0
            ? scrambleSetsForRound(
              usedScrambleIdsByEvent[e.id],
              r,
              uploadedScrambles,
            )
            : r.scrambleSets,
      })),
    })),
  };
};
