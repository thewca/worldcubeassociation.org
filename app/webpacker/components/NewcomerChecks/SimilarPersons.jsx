import _ from 'lodash';
import React, { useState } from 'react';
import {
  Button, Message, Modal, Segment,
} from 'semantic-ui-react';
import SimilarPersonTable from './SimilarPersonTable';
import MergeModal from './MergeModal';

export default function SimilarPersons({ similarPersons, competitionId, setUserIdToEdit }) {
  const duplicatesByUserId = _.groupBy(similarPersons, 'original_user_id');
  const userIds = _.keys(duplicatesByUserId);

  const [potentialDuplicatePerson, setPotentialDuplicatePerson] = useState();
  const [mergeSuccess, setMergeSuccess] = useState(false);

  if (userIds.length === 0) {
    return <Segment>No newcomers to show</Segment>;
  }

  return (
    <>
      {userIds.map((userId) => (
        <SimilarPersonTable
          potentialDuplicates={duplicatesByUserId[userId]}
          editUser={setUserIdToEdit}
          mergePotentialDuplicate={setPotentialDuplicatePerson}
        />
      ))}
      <Modal
        open={potentialDuplicatePerson}
        onClose={() => setPotentialDuplicatePerson(null)}
        closeIcon
      >
        <Modal.Header>Merge</Modal.Header>
        <Modal.Content>
          <MergeModal
            potentialDuplicatePerson={potentialDuplicatePerson}
            competitionId={competitionId}
            onMergeSuccess={() => {
              setPotentialDuplicatePerson(null);
              setMergeSuccess(true);
            }}
          />
        </Modal.Content>
      </Modal>
      <Modal
        open={mergeSuccess}
        onClose={() => setMergeSuccess(false)}
        size="tiny"
      >
        <Modal.Content>
          <Message success>
            Merged Successfully. Please make sure to re-sync WCA Live
            and other tools (like Groupifier) to get the updated details.
          </Message>
        </Modal.Content>
        <Modal.Actions>
          <Button primary onClick={() => setMergeSuccess(false)}>
            OK
          </Button>
        </Modal.Actions>
      </Modal>
    </>
  );
}
