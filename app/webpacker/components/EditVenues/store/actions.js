export const ChangesSaved = 'saving_started';
export const EditVenue = 'EDIT_VENUE';
export const EditRoom = 'EDIT_ROOM';
export const RemoveVenue = 'REMOVE_VENUE';
export const RemoveRoom = 'REMOVE_ROOM';
export const AddVenue = 'ADD_VENUE';
export const AddRoom = 'ADD_ROOM';
export const CopyVenue = 'COPY_VENUE';
export const CopyRoom = 'COPY_ROOM';

/**
 * Action creator for marking changes as saved.
 * @returns {Action}
 */
export const changesSaved = () => ({
  type: ChangesSaved,
});

/**
 * Action creator for changing a venue's properties.
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
 * Action creator for changing a room's properties.
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
 * @param {int} roomId
 * @returns {Action}
 */
export const copyRoom = (roomId) => ({
  type: CopyRoom,
  payload: {
    roomId,
  },
});
