import React from 'react';
import {
  Button,
  Card,
  Form,
  Icon,
} from 'semantic-ui-react';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { editRoom, removeRoom } from '../store/actions';

function RoomPanel({
  room,
  sendToFront,
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

  return (
    <Card fluid raised>
      <Card.Content>
        <Card.Header>
          {sendToFront && (
            <Button floated="left" compact icon labelPosition="left" onClick={sendToFront}>
              <Icon name="up arrow" />
              To front
            </Button>
          )}
          <Button floated="right" compact icon labelPosition="left" negative onClick={handleDeleteRoom}>
            <Icon name="trash" />
            Remove
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
