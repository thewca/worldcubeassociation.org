import _ from 'lodash';
import React, { useState } from 'react';
import { Modal, Segment } from 'semantic-ui-react';
import SimilarPersonTable from './SimilarPersonTable';
import MergeModal from './MergeModal';

export default function SimilarPersons({ similarPersons, competitionId, setUserIdToEdit }) {
  const duplicatesByUserId = _.groupBy(similarPersons, 'original_user_id');
  const userIds = _.keys(duplicatesByUserId);

  const [potentialDuplicatePerson, setPotentialDuplicatePerson] = useState();

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
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
