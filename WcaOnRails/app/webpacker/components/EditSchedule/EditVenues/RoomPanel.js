import React from 'react';
import {
  Button,
  Card,
  Form,
  Icon,
} from 'semantic-ui-react';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { editRoom, removeRoom, reorderRoom } from '../store/actions';

function RoomPanel({
  venueId,
  room,
  roomIndex,
}) {
  const dispatch = useDispatch();

  const confirm = useConfirm();

  const handleChange = (evt, { name, value }) => {
    dispatch(editRoom(room.id, name, value));
  };

  const handleRoomToFront = () => {
    dispatch(reorderRoom(venueId, roomIndex, 0));
  };

  const handleDeleteRoom = () => {
    confirm({
      content: `Are you sure you want to delete the room ${room.name}? This will also delete all associated schedules. THIS ACTION CANNOT BE UNDONE!`,
    }).then(() => dispatch(removeRoom(room.id)));
  };

  return (
    <Card fluid raised>
      <Card.Content>
        <Card.Header>
          <Button floated="right" compact icon negative title="Remove" onClick={handleDeleteRoom}>
            <Icon name="trash" />
          </Button>
          {roomIndex > 0 && (
            <Button floated="right" compact icon title="To front" onClick={handleRoomToFront}>
              <Icon name="angle double up" />
            </Button>
          )}
        </Card.Header>
        <Card.Description>
          <Form>
            <Form.Input
              id="room-name"
              label="Name"
              name="name"
              value={room.name}
              onChange={handleChange}
            />
            <Form.Input
              className="room-color-cell"
              label="Color"
              name="color"
              type="color"
              value={room.color}
              onChange={handleChange}
            />
          </Form>
        </Card.Description>
      </Card.Content>
    </Card>
  );
}

export default RoomPanel;
