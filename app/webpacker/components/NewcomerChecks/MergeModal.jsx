import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from 'semantic-ui-react';
import MergeUsers from '../Panel/pages/MergeUsersPage/MergeUsers';
import AssignWcaIdToUser from '../Panel/views/AssignWcaIdToUser';
import ApproveWcaIdClaim from '../Panel/views/ApproveWcaIdClaim';
import { editPersonUrl } from '../../lib/requests/routes.js.erb';

export default function MergeModal({
  potentialDuplicatePerson, competitionId, onMergeSuccess,
}) {
  const queryClient = useQueryClient();
  const {
    original_user: originalUser,
    duplicate_person: duplicatePerson,
  } = potentialDuplicatePerson;

  const clearUserIdsFromDuplicates = (ids) => {
    queryClient.setQueryData(
      ['last-duplicate-checker-job', competitionId],
      (previousData) => ({
        ...previousData,
        potential_duplicate_persons: previousData.potential_duplicate_persons.filter(
          (person) => !ids.includes(person.original_user_id),
        ),
      }),
    );
  };

  const onMergeUsersSuccess = (_, { fromUserId, toUserId }) => {
    clearUserIdsFromDuplicates([fromUserId, toUserId]);
    onMergeSuccess();
  };

  const onAssignSuccess = (_, { userId }) => {
    clearUserIdsFromDuplicates([userId]);
    onMergeSuccess();
  };

  if (duplicatePerson.user_id) {
    return (
      <MergeUsers
        firstUserId={originalUser.id}
        secondUserId={duplicatePerson.user_id}
        onSuccess={onMergeUsersSuccess}
        requireConfirmation
      />
    );
  }

  if (originalUser.unconfirmed_wca_id) {
    if (originalUser.unconfirmed_wca_id !== duplicatePerson.wca_id) {
      return (
        <Message error>
          The user has claimed for a different WCA ID (
          {originalUser.unconfirmed_wca_id}
          ), and first cancel that claim request if you want to assign another WCA ID.
          {' '}
          You can do this on the
          {' '}
          <a
            href={editPersonUrl(originalUser.id)}
            target="_blank"
            rel="noreferrer"
          >
            user edit page
          </a>
          .
        </Message>
      );
    }
    return (
      <ApproveWcaIdClaim
        user={originalUser}
        onSuccess={onAssignSuccess}
        requireConfirmation
      />
    );
  }

  return (
    <AssignWcaIdToUser
      user={originalUser}
      prefilledWcaId={duplicatePerson.wca_id}
      onSuccess={onAssignSuccess}
      requireConfirmation
    />
  );
}
