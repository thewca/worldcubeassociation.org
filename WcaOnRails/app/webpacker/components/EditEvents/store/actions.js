export const ChangesSaved = 'saving_started';
export const RemoveEvent = 'REMOVE_EVENT';
export const RemoveRounds = 'REMOVE_ROUNDS';
export const AddRound = 'ADD_ROUND';
export const SetRoundFormat = 'SET_ROUND_FORMAT';
export const SetScrambleSetCount = 'SET_SCRAMBLE_SET_COUNT';

/**
 * Action creator for marking changes as saved
 * @returns {Action}
 */
export const changesSaved = () => ({
  type: ChangesSaved,
});

/**
 * Action creator for removing event
 * @param {EventId} eventId
 * @returns {Action}
 */
export const removeEvent = (eventId) => ({
  type: RemoveEvent,
  payload: {
    eventId,
  },
});

/**
 * Action creator for removing rounds
 * @param {EventId} eventId
 * @param {number} roundsToRemoveCount
 * @returns {Action}
 */
export const removeRounds = (eventId, roundsToRemoveCount) => ({
  type: RemoveRounds,
  payload: {
    eventId,
    roundsToRemoveCount,
  },
});

/**
 * Action creator for adding round
 * @param {EventId} eventId
 * @returns {Action}
 */
export const addRound = (eventId) => ({
  type: AddRound,
  payload: {
    eventId,
  },
});

/**
 * set the round format
 * @param {Round} wcifRound
 * @param {FormatId} newFormat
 * @returns {Action}
 */
export const setRoundFormat = (wcifRound, newFormat) => ({
  type: SetRoundFormat,
  payload: {
    wcifRound,
    newFormat,
  },
});

/**
 * set the scramble set count for the round
 * @param {Round} wcifRound
 * @param {number} newScrambleSetCount
 * @returns {Action}
 */
export const setScrambleSetCount = (wcifRound, newScrambleSetCount) => ({
  type: SetScrambleSetCount,
  payload: {
    wcifRound,
    newScrambleSetCount,
  },
});
