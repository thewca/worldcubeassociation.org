export const ChangesSaved = 'saving_started';
export const RemoveEvent = 'REMOVE_EVENT';
export const AddRounds = 'ADD_ROUNDS';
export const RemoveRounds = 'REMOVE_ROUNDS';
export const SetRoundFormat = 'SET_ROUND_FORMAT';
export const SetScrambleSetCount = 'SET_SCRAMBLE_SET_COUNT';
export const UpdateCutoff = 'UPDATE_CUTOFF';

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
 * create an action to add round
 * @param {EventId} eventId
 * @param {number} roundsToAddCount
 * @returns {Action}
 */
export const addRounds = (eventId, roundsToAddCount) => ({
  type: AddRounds,
  payload: {
    eventId,
    roundsToAddCount,
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
 * create an action to set the round format
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
 * create an action to set the scramble set count for the round
 * @param {ActivityCode} roundId
 * @param {number} newScrambleSetCount
 * @returns {Action}
 */
export const setScrambleSetCount = (roundId, scrambleSetCount) => ({
  type: SetScrambleSetCount,
  payload: {
    roundId,
    scrambleSetCount,
  },
});

/**
 * create an action to set the cutoff for the round
 * @param {ActivityCode} roundId
 * @param {Cutoff} cutoff
 * @returns {Action}
 */
export const updateCutoff = (roundId, cutoff) => ({
  type: UpdateCutoff,
  payload: {
    roundId,
    cutoff,
  },
});
