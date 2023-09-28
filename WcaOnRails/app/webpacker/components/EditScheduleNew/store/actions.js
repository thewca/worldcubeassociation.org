export const ChangesSaved = 'saving_started';
export const AddActivity = 'ADD_ACTIVITY';
export const RemoveActivity = 'REMOVE_ACTIVITY';
export const MoveActivity = 'MOVE_ACTIVITY';
export const ScaleActivity = 'SCALE_ACTIVITY';
export const EditVenue = 'EDIT_VENUE';
export const EditRoom = 'EDIT_ROOM';

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

export const editVenue = (venueId, propertyKey, newProperty) => ({
  type: EditVenue,
  payload: {
    venueId,
    propertyKey,
    newProperty,
  },
});

export const editRoom = (roomId, propertyKey, newProperty) => ({
  type: EditRoom,
  payload: {
    roomId,
    propertyKey,
    newProperty,
  },
});
