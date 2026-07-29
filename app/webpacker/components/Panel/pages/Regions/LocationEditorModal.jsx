import React from 'react';
import { Button, Modal } from 'semantic-ui-react';
import useInputState from '../../../../lib/hooks/useInputState';
import LocationEditorForm from './LocationEditorForm';

export default function LocationEditorModal({ onClose, delegate, onSubmit }) {
  const [groupId, setGroupId] = useInputState(delegate?.group?.id);
  const [location, setLocation] = useInputState(delegate?.metadata?.location);

  return (
    <Modal open onClose={onClose}>
      <Modal.Header>Edit Location</Modal.Header>

      <Modal.Content>
        <LocationEditorForm
          groupId={groupId}
          setGroupId={setGroupId}
          location={location}
          setLocation={setLocation}
        />
      </Modal.Content>

      <Modal.Actions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSubmit({ groupId, location })}>Save</Button>
      </Modal.Actions>
    </Modal>
  );
}
