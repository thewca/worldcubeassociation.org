import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  Container,
  Form,
  Icon,
  Modal,
} from 'semantic-ui-react';

import { copyRoomActivities } from '../store/actions';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { venueWcifFromRoomId } from '../../../lib/utils/wcif';
import useInputState from '../../../lib/hooks/useInputState';

function ActionsHeader({
  selectedRoomId,
  shouldUpdateMatches,
  setShouldUpdateMatches,
}) {
  const { wcifSchedule } = useStore();

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  const otherRoomsWithNonEmptySchedules = wcifSchedule.venues.flatMap(
    (venue) => venue.rooms.filter(
      (room) => room.activities.length > 0 && room.id !== selectedRoomId,
    ).map((room) => ({
      key: room.id,
      text: `${venue.name} - ${room.name}`,
      value: room.id,
    })),
  );

  return (
    otherRoomsWithNonEmptySchedules.length > 0 && (
      <Container>
        <CopyRoomScheduleModal
          isOpen={isCopyModalOpen}
          selectedRoomId={selectedRoomId}
          roomOptions={otherRoomsWithNonEmptySchedules}
          close={() => setIsCopyModalOpen(false)}
        />

        <Button compact icon labelPosition="left" onClick={() => setIsCopyModalOpen(true)}>
          <Icon name="calendar plus" />
          Copy another room
        </Button>
        <Checkbox
          label="Apply changes to matching activities (same type, start time, and end time) in other rooms"
          checked={shouldUpdateMatches}
          onChange={setShouldUpdateMatches}
        />
      </Container>
    )
  );
}

function CopyRoomScheduleModal({
  isOpen,
  selectedRoomId,
  roomOptions,
  close,
}) {
  const { wcifSchedule } = useStore();
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [toCopyRoomId, setToCopyRoomId] = useInputState();
  const selectedRoomVenue = venueWcifFromRoomId(wcifSchedule, selectedRoomId);
  const toCopyRoomVenue = venueWcifFromRoomId(wcifSchedule, toCopyRoomId);
  const areRoomsInSameVenue = selectedRoomVenue.id === toCopyRoomVenue?.id;

  const onClose = () => {
    setToCopyRoomId(undefined);
    close();
  };

  const dispatchAndClose = () => {
    dispatch(copyRoomActivities(toCopyRoomId, selectedRoomId));
    onClose();
  };

  const handleCopyRoom = () => {
    if (areRoomsInSameVenue) {
      dispatchAndClose();
    } else {
      confirm({
        content: 'The room you selected is in a different venue. You should probably only be copying from a different venue for a multi-location fewest moves competition. If so, make sure you correctly set all venue time zones BEFORE proceeding with this copy. Are you sure you want to proceed?',
      }).then(dispatchAndClose);
    }
  };

  return (
    <Modal
      open={isOpen}
      dimmer="blurring"
    >
      <Modal.Header>Copy Existing Schedule</Modal.Header>
      <Modal.Content as={Form}>
        <Form.Select
          label="Room to copy from"
          name="roomId"
          options={roomOptions}
          value={toCopyRoomId}
          onChange={setToCopyRoomId}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button
          icon="copy"
          content="Copy"
          positive
          disabled={toCopyRoomId === undefined}
          onClick={handleCopyRoom}
        />
        <Button
          icon="cancel"
          content="Cancel"
          negative
          onClick={onClose}
        />
      </Modal.Actions>
    </Modal>
  );
}

export default ActionsHeader;
