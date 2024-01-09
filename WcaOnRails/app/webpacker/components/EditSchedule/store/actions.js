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
export const ReorderRoom = 'REORDER_ROOM';
export const ReorderVenue = 'REORDER_VENUE';

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
 * Action creator for moving a venue to a different position.
 * @param {int} to
 * @param {int} from
 * @returns {Action}
 */
export const reorderVenue = (from, to) => ({
  type: ReorderVenues,
  payload: {
    from,
    to,
  },
});

/**
 * Action creator for moving a room to a different position.
 * @param {int} venueId
 * @param {int} to
 * @param {int} from
 * @returns {Action}
 */
export const reorderRoom = (venueId, from, to) => ({
  type: ReorderRooms,
  payload: {
    venueId,
    from,
    to,
  },
});
