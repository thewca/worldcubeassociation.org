export const ChangesSaved = 'saving_started';
export const AddActivity = 'ADD_ACTIVITY';
export const RemoveActivity = 'REMOVE_ACTIVITY';
export const MoveActivity = 'MOVE_ACTIVITY';
export const ScaleActivity = 'SCALE_ACTIVITY';

/**
 * Action creator for marking changes as saved
 * @returns {Action}
 */
export const changesSaved = () => ({
  type: ChangesSaved,
});

/**
 * Action creator for adding activity
 * @param {ActivityId} activityId
 * @returns {Action}
 */
export const addActivity = (wcifActivity, roomId) => ({
  type: AddActivity,
  payload: {
    wcifActivity,
    roomId,
  },
});

/**
 * Action creator for removing event
 * @param {ActivityId} activityId
 * @returns {Action}
 */
export const removeActivity = (activityId) => ({
  type: RemoveActivity,
  payload: {
    activityId,
  },
});

export const moveActivity = (activityId, isoDuration) => ({
  type: MoveActivity,
  payload: {
    activityId,
    isoDuration,
  },
});

export const scaleActivity = (activityId, scaleStartIso, scaleEndIso) => ({
  type: ScaleActivity,
  payload: {
    activityId,
    scaleStartIso,
    scaleEndIso,
  },
});
