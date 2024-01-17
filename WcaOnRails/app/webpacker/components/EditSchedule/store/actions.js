export const ChangesSaved = 'saving_started';
export const AddActivity = 'ADD_ACTIVITY';
export const EditActivity = 'EDIT_ACTIVITY';
export const RemoveActivity = 'REMOVE_ACTIVITY';
export const MoveActivity = 'MOVE_ACTIVITY';
export const ScaleActivity = 'SCALE_ACTIVITY';
export const EditVenue = 'EDIT_VENUE';
export const EditRoom = 'EDIT_ROOM';
export const RemoveVenue = 'REMOVE_VENUE';
export const RemoveRoom = 'REMOVE_ROOM';
export const AddVenue = 'ADD_VENUE';
export const AddRoom = 'ADD_ROOM';
export const CopyVenue = 'COPY_VENUE';
export const CopyRoom = 'COPY_ROOM';
export const CopyRoomActivities = 'COPY_ROOM_ACTIVITIES';

/**
 * Action creator for marking changes as saved
 * @returns {Action}
 */
export const changesSaved = () => ({
  type: ChangesSaved,
});

/**
 * Action creator for adding activity
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
 * Action creator for modifying details of an activity
 * @param {int} activityId
 * @returns {Action}
 */
export const editActivity = (activityId, key, value) => ({
  type: EditActivity,
  payload: {
    activityId,
    key,
    value,
  },
});

/**
 * Action creator for removing activity
 * @param {int} activityId
 * @returns {Action}
 */
export const removeActivity = (activityId) => ({
  type: RemoveActivity,
  payload: {
    activityId,
  },
});

/**
 * Action creator for moving an activity's time
 * @param {int} activityId
 * @param {string} isoDuration
 * @returns {Action}
 */
export const moveActivity = (activityId, isoDuration) => ({
  type: MoveActivity,
  payload: {
    activityId,
    isoDuration,
  },
});

/**
 * Action creator for scaling an activity's time,
 * i.e. changing the start and/or end date by some delta
 * @param {int} activityId
 * @param {string} isoDeltaStart
 * @param {string} isoDeltaEnd
 * @returns {Action}
 */
export const scaleActivity = (activityId, isoDeltaStart, isoDeltaEnd) => ({
  type: ScaleActivity,
  payload: {
    activityId,
    isoDeltaStart,
    isoDeltaEnd,
  },
});

/**
 * Action creator for changing a venue's properties
 * @param {int} venueId
 * @param {string} propertyKey
 * @param {string} newProperty
 * @returns {Action}
 */
export const editVenue = (venueId, propertyKey, newProperty) => ({
  type: EditVenue,
  payload: {
    venueId,
    propertyKey,
    newProperty,
  },
});

/**
 * Action creator for changing a room's properties
 * @param {int} roomId
 * @param {string} propertyKey
 * @param {string} newProperty
 * @returns {Action}
 */
export const editRoom = (roomId, propertyKey, newProperty) => ({
  type: EditRoom,
  payload: {
    roomId,
    propertyKey,
    newProperty,
  },
});

/**
 * Action creator for removing a venue.
 * @param {int} venueId
 * @returns {Action}
 */
export const removeVenue = (venueId) => ({
  type: RemoveVenue,
  payload: {
    venueId,
  },
});

/**
 * Action creator for removing a room.
 * @param {int} roomId
 * @returns {Action}
 */
export const removeRoom = (roomId) => ({
  type: RemoveRoom,
  payload: {
    roomId,
  },
});

/**
 * Action creator for adding a blank venue.
 * @returns {Action}
 */
export const addVenue = () => ({
  type: AddVenue,
  payload: {},
});

/**
 * Action creator for adding a blank room.
 * @param {int} venueId
 * @returns {Action}
 */
export const addRoom = (venueId) => ({
  type: AddRoom,
  payload: {
    venueId,
  },
});

/**
 * Action creator for copying a venue.
 * @param {int} venueId
 * @returns {Action}
 */
export const copyVenue = (venueId) => ({
  type: CopyVenue,
  payload: {
    venueId,
  },
});

/**
 * Action creator for copying a room.
 * @param {int} venueId
 * @param {int} roomId
 * @returns {Action}
 */
export const copyRoom = (venueId, roomId) => ({
  type: CopyRoom,
  payload: {
    venueId,
    roomId,
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
