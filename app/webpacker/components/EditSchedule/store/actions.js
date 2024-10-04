export const ChangesSaved = 'saving_started';
export const AddActivity = 'ADD_ACTIVITY';
export const EditActivity = 'EDIT_ACTIVITY';
export const RemoveActivity = 'REMOVE_ACTIVITY';
export const MoveActivity = 'MOVE_ACTIVITY';
export const ScaleActivity = 'SCALE_ACTIVITY';
export const CopyRoomActivities = 'COPY_ROOM_ACTIVITIES';

/**
 * Action creator for marking changes as saved.
 * @returns {Action}
 */
export const changesSaved = () => ({
  type: ChangesSaved,
});

/**
 * Action creator for adding activity.
 * @param {Activity} wcifActivity
 * @param {int} roomId
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
 * Action creator for modifying details of an activity.
 * @param {int} activityId
 * @param {string} key
 * @param {string} value
 * @param {boolean} updateMatches
 * @returns {Action}
 */
export const editActivity = (activityId, key, value, updateMatches) => ({
  type: EditActivity,
  payload: {
    activityId,
    key,
    value,
    updateMatches,
  },
});

/**
 * Action creator for removing activity.
 * @param {int} activityId
 * @param {boolean} updateMatches
 * @returns {Action}
 */
export const removeActivity = (activityId, updateMatches) => ({
  type: RemoveActivity,
  payload: {
    activityId,
    updateMatches,
  },
});

/**
 * Action creator for moving an activity's time.
 * @param {int} activityId
 * @param {string} isoDuration
 * @param {boolean} updateMatches
 * @returns {Action}
 */
export const moveActivity = (activityId, isoDuration, updateMatches = false) => ({
  type: MoveActivity,
  payload: {
    activityId,
    isoDuration,
    updateMatches,
  },
});

/**
 * Action creator for scaling an activity's time,
 * i.e. changing the start and/or end date by some delta.
 * @param {int} activityId
 * @param {string} isoDeltaStart
 * @param {string} isoDeltaEnd
 * @param {boolean} updateMatches
 * @returns {Action}
 */
export const scaleActivity = (activityId, isoDeltaStart, isoDeltaEnd, updateMatches = false) => ({
  type: ScaleActivity,
  payload: {
    activityId,
    isoDeltaStart,
    isoDeltaEnd,
    updateMatches,
  },
});

/**
 * Action creator for copying a room's activities to another room.
 * @param {int} sourceRoomId
 * @param {int} targetRoomId
 * @returns {Action}
 */
export const copyRoomActivities = (sourceRoomId, targetRoomId) => ({
  type: CopyRoomActivities,
  payload: {
    sourceRoomId,
    targetRoomId,
  },
});
