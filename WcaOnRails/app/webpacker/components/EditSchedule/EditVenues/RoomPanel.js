import React from 'react';
import { Button, Card, Form, Icon } from 'semantic-ui-react';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { editRoom } from '../store/actions';

function RoomPanel({
  room,
}) {
  const dispatch = useDispatch();

  const handleChange = (evt, { name, value }) => {
    dispatch(editRoom(room.id, name, value));
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
        <Button negative icon>
          <Icon name="trash" />
        </Button>
      </Card.Content>
    </Card>
  );
}

export default RoomPanel;
