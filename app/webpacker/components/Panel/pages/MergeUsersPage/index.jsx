import React, { useState } from 'react';
import { Button, Header, Modal } from 'semantic-ui-react';
import AdminWcaSearch from '../../../SearchWidget/AdminWcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import useInputState from '../../../../lib/hooks/useInputState';
import MergeUsers from './MergeUsers';

export default function MergeUsersPage() {
  const [firstUserId, setFirstUserId] = useInputState();
  const [secondUserId, setSecondUserId] = useInputState();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Header>Merge Users</Header>
      <Header as="h4">Select User 1</Header>
      <AdminWcaSearch
        label="Search User"
        model={SEARCH_MODELS.user}
        multiple={false}
        value={firstUserId}
        onChange={setFirstUserId}
      />
      <Header as="h4">Select User 2</Header>
      <AdminWcaSearch
        label="Search User"
        model={SEARCH_MODELS.user}
        multiple={false}
        value={secondUserId}
        onChange={setSecondUserId}
      />
      <Button
        primary
        disabled={!firstUserId || !secondUserId || firstUserId === secondUserId}
        onClick={() => setModalOpen(true)}
      >
        Initiate Merge
      </Button>
      <Modal open={modalOpen}>
        <Modal.Content>
          <MergeUsers firstUserId={firstUserId} secondUserId={secondUserId} />
        </Modal.Content>
      </Modal>
    </>
  );
}
