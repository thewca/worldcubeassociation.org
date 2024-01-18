import React, { useState } from 'react';
import {
  Button,
  Container,
  Form,
  Icon,
  Modal,
} from 'semantic-ui-react';

import { copyRoomActivities } from '../store/actions';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';

function ActionsHeader({ wcifSchedule, selectedRoomId }) {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  
  return (
    <Container>
      <CopyRoomScheduleModal
        isOpen={isCopyModalOpen}
        wcifSchedule={wcifSchedule}
        selectedRoomId={selectedRoomId}
        close={() => setIsCopyModalOpen(false)}
      />

      <Button compact icon labelPosition="left" onClick={()=> setIsCopyModalOpen(true)}>
        <Icon name="calendar plus" />
        Copy another room
      </Button>
    </Container>
  )
}

function CopyRoomScheduleModal({ isOpen, wcifSchedule, selectedRoomId, close }) {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [toCopyRoomId, setToCopyRoomId] = useState();
  const selectedRoomVenue = wcifSchedule.venues.find(({ rooms }) => rooms.map(({id}) => id).includes(selectedRoomId))
  const toCopyRoomVenue = wcifSchedule.venues.find(({ rooms }) => rooms.map(({id}) => id).includes(toCopyRoomId))
  const areRoomsInSameVenue = selectedRoomVenue.id === toCopyRoomVenue?.id

  const roomOptions = wcifSchedule.venues.flatMap((venue) => venue.rooms.filter((room) => room.activities.length > 0 && room.id !== selectedRoomId).map((room) => ({
    key: room.id,
    text: venue.name + " - " + room.name,
    value: room.id,
  })))

  const dispatchAndClose = () => {
    dispatch(copyRoomActivities(toCopyRoomId, selectedRoomId));
    close();
  }

  const handleCopyRoom = () => {
    if (areRoomsInSameVenue) {
      dispatchAndClose()
    } else {
     confirm({
        content: `The room you selected is in a different venue. You should probably only be copying from a different venue for a multi-location fewest moves competition. Are you sure you want to proceed?`,
      }).then(dispatchAndClose)
    }
  }

  const onClose = () => {
    setToCopyRoomId(undefined)
    close()
  }

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
          onChange={(_, data) => setToCopyRoomId(data.value)}
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
  )
}

export default ActionsHeader;
