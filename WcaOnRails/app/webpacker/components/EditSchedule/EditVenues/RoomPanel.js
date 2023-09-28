import React from 'react';
import { Button, Card, Form, Icon } from 'semantic-ui-react';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { editRoom, removeRoom } from '../store/actions';

function RoomPanel({
  room,
}) {
  const dispatch = useDispatch();

  const handleChange = (evt, { name, value }) => {
    dispatch(editRoom(room.id, name, value));
  };

  const handleDeleteRoom = () => {
    if (confirm(`Are you sure you want to delete the room ${room.name}? This will also delete all associated schedules. THIS ACTION CANNOT BE UNDONE!`)) {
      dispatch(removeRoom(room.id));
    }
  };

  return (
    <Card fluid raised>
      <Card.Content>
        <Form>
          <Form.Input
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
      </Card.Content>
      <Card.Content>
        <Button negative icon onClick={handleDeleteRoom}>
          <Icon name="trash" />
        </Button>
      </Card.Content>
    </Card>
  );
}

export default RoomPanel;
