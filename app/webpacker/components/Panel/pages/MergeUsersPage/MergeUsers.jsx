import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Button, Header, Message, Select,
} from 'semantic-ui-react';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import getUserDetails from './api/getUserDetails';
import useInputState from '../../../../lib/hooks/useInputState';
import mergeUsers from './api/mergeUsers';
import SpecialAccountDetails from './SpecialAccountDetails';

export default function MergeUsers({ firstUserId, secondUserId }) {
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

  const {
    mutate: mergeUsersMutation,
    isPending: isMergePending,
    isError: isMergeError,
    error: mergeError,
    isSuccess,
  } = useMutation({
    mutationFn: () => {
      const fromUserId = (
        firstUserId === toUserId ? secondUserId : firstUserId
      );
      return mergeUsers(toUserId, fromUserId);
    },
  });

  if (isPendingFirstUser || isPendingSecondUser || isMergePending) return <Loading />;
  if (isErrorFirstUser) return <Errored error={errorFirstUser} />;
  if (isErrorSecondUser) return <Errored error={errorSecondUser} />;
  if (isMergeError) return <Errored error={mergeError} />;
  if (isSuccess) return <Message success>Merged Successfully.</Message>;

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
        Select the email ID that want to be maintained
        (the account with the other email ID will be anonymized)
      </div>
      <Select
        options={selectOptions}
        value={toUserId}
        onChange={setToUserId}
      />
      <Button
        primary
        disabled={!toUserId}
        onClick={mergeUsersMutation}
      >
        Merge
      </Button>
    </>
  );
}
