import React, { useState } from 'react';
import { Container, Modal, Tab } from 'semantic-ui-react';
import { useQueryClient } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import DuplicateChecker from './DuplicateChecker';
import NameFormatChecker from './NameFormatChecker';
import DobChecker from './DobChecker';
import EditUser from '../EditUser';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <NewcomerChecks competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

function NewcomerChecks({ competitionId }) {
  const [userIdToEdit, setUserIdToEdit] = useState();

  const queryClient = useQueryClient();

  const onUserEdit = (user) => {
    queryClient.setQueryData(
      ['last-duplicate-checker-job', competitionId],
      (previousData) => ({
        ...previousData,
        potential_duplicate_persons: (
          previousData.potential_duplicate_persons.map((person) => (
            person.original_user_id === user.id
              ? { ...person, original_user: user }
              : person
          ))),
      }),
    );

    if (queryClient.getQueryData(['newcomer-name-format-checks', competitionId])?.some((check) => check.id === user.id)) {
      queryClient.invalidateQueries(['newcomer-name-format-checks', competitionId]);
    }
  };

  const panes = [
    {
      menuItem: 'Duplicate Checker',
      render: () => (
        <Tab.Pane>
          <DuplicateChecker
            competitionId={competitionId}
            setUserIdToEdit={setUserIdToEdit}
          />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Name Formats Checker',
      render: () => (
        <Tab.Pane>
          <NameFormatChecker
            competitionId={competitionId}
            setUserIdToEdit={setUserIdToEdit}
          />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'DOB Checker',
      render: () => (
        <Tab.Pane>
          <DobChecker competitionId={competitionId} />
        </Tab.Pane>
      ),
    },
  ];

  return (
    <>
      <Container fluid>
        <Tab panes={panes} />
      </Container>
      <Modal
        open={userIdToEdit}
        onClose={() => setUserIdToEdit(null)}
        closeIcon
      >
        <Modal.Header>Edit User</Modal.Header>
        <Modal.Content>
          <EditUser
            id={userIdToEdit}
            onSuccess={onUserEdit}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
