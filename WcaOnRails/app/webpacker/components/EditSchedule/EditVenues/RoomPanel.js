import React from 'react';
import {
  Button,
  Card,
  Form,
  Icon,
} from 'semantic-ui-react';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { copyRoom, editRoom, removeRoom } from '../store/actions';

function RoomPanel({
  room,
}) {
  const dispatch = useDispatch();

  const confirm = useConfirm();

  const handleChange = (evt, { name, value }) => {
    dispatch(editRoom(room.id, name, value));
  };

  const handleDeleteRoom = () => {
    confirm({
      content: `Are you sure you want to delete the room ${room.name}? This will also delete all associated schedules. THIS ACTION CANNOT BE UNDONE!`,
    }).then(() => dispatch(removeRoom(room.id)));
  };

  const handleCopyRoom = () => {
    dispatch(copyRoom(venueId, room.id))
  }

  return (
    <Card fluid raised>
      <Card.Content>
        <Card.Header>
          <Button floated="right" compact icon title="Remove" negative onClick={handleDeleteRoom}>
            <Icon name="trash" />
          </Button>
          <Button floated="right" compact icon title="Copy" onClick={handleCopyRoom}>
            <Icon name="copy" />
          </Button>
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
