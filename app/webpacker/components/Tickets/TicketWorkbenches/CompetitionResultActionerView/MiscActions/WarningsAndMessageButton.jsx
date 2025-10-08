import React, { useState } from 'react';
import { Button, Modal, Popup } from 'semantic-ui-react';
import WarningsAndMessage from '../WarningsAndMessage';

export default function WarningsAndMessageButton({ ticketDetails }) {
  const [isModalOpen, setIsModalOpen] = useState();

  return (
    <>
      <Popup
        trigger={(
          <Button onClick={() => setIsModalOpen(true)}>
            Warnings & Message
          </Button>
        )}
        content="View the warnings of the competition and Delegate's message to WRT."
      />
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        closeIcon
      >
        <Modal.Header>Warnings & Message</Modal.Header>
        <Modal.Content>
          <WarningsAndMessage ticketDetails={ticketDetails} />
        </Modal.Content>
      </Modal>
    </>
  );
}
