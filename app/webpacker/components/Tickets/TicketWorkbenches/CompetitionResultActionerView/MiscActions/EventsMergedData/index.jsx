import React, { useState } from 'react';
import { Button, Modal, Popup } from 'semantic-ui-react';
import EventsMergedDataContent from './EventsMergedDataContent';

export default function EventsMergedData({ ticketDetails }) {
  const [isModalOpen, setIsModalOpen] = useState();

  return (
    <>
      <Popup
        trigger={(
          <div>
            {/* Button wrapped in a div because disabled button does not fire mouse events */}
            <Button onClick={() => setIsModalOpen(true)}>
              Events Merged Data
            </Button>
          </div>
      )}
        content="View & manage the results data of every events which are merged."
      />
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        closeIcon
      >
        <Modal.Header>Events Merged Data</Modal.Header>
        <Modal.Content>
          <EventsMergedDataContent ticketDetails={ticketDetails} />
        </Modal.Content>
      </Modal>
    </>
  );
}
