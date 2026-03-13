import React, { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Button, Form, Header, Select,
} from 'semantic-ui-react';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import getUserDetails from './api/getUserDetails';
import useInputState from '../../../../lib/hooks/useInputState';
import mergeUsers from './api/mergeUsers';
import SpecialAccountDetails from './SpecialAccountDetails';
import { useConfirm } from '../../../../lib/providers/ConfirmProvider';

export default function MergeUsers({
  firstUserId, secondUserId, onSuccess, requireConfirmation,
}) {
  const confirm = useConfirm();
  const {
    data: firstUser,
    isPending: isPendingFirstUser,
    isError: isErrorFirstUser,
    error: errorFirstUser,
  } = useQuery({
    queryKey: ['user-details', firstUserId],
    queryFn: () => getUserDetails(firstUserId),
  });

  const {
    data: secondUser,
    isPending: isPendingSecondUser,
    isError: isErrorSecondUser,
    error: errorSecondUser,
  } = useQuery({
    queryKey: ['user-details', secondUserId],
    queryFn: () => getUserDetails(secondUserId),
  });

  const [toUserId, setToUserId] = useInputState();
  const fromUserId = useMemo(() => (
    firstUserId === toUserId ? secondUserId : firstUserId
  ), [toUserId, firstUserId, secondUserId]);

  const {
    mutate: mergeUsersMutation,
    isPending: isMergePending,
    isError: isMergeError,
    error: mergeError,
  } = useMutation({
    mutationFn: mergeUsers,
    onSuccess,
  });

  if (isPendingFirstUser || isPendingSecondUser || isMergePending) return <Loading />;
  if (isErrorFirstUser) return <Errored error={errorFirstUser} />;
  if (isErrorSecondUser) return <Errored error={errorSecondUser} />;
  if (isMergeError) return <Errored error={mergeError} />;

  const selectOptions = [firstUser, secondUser].map((user) => ({
    key: user.id,
    text: user.email,
    value: user.id,
  }));

  return (
    <>
      <Header>Merge Users</Header>
      <SpecialAccountDetails user={firstUser} />
      <SpecialAccountDetails user={secondUser} />
      <div>
        Select the account to keep
        (all data from the other account will be transferred to this one)
      </div>
      <Form>
        <Form.Field>
          <Select
            options={selectOptions}
            value={toUserId}
            onChange={setToUserId}
          />
        </Form.Field>
        <Form.Field>
          <Button
            primary
            disabled={!toUserId}
            onClick={() => {
              if (requireConfirmation) {
                confirm({
                  content: 'Are you sure you want to merge these users?',
                  confirmButton: 'Merge',
                  requireInput: 'MERGE USERS',
                })
                  .then(() => mergeUsersMutation({ fromUserId, toUserId }))
                  .catch(() => {});
              } else {
                mergeUsersMutation({ fromUserId, toUserId });
              }
            }}
          >
            Merge
          </Button>
        </Form.Field>
      </Form>
    </>
  );
}
