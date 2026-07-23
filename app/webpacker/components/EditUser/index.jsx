import React, { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import getUserDetails from './api/getUserDetails';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import EditUserForm from './EditUserForm';

export default function EditUser({ id, onSuccess }) {
  const queryClient = useQueryClient();

  const {
    data: userDetails,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['user-details-for-edit', id],
    queryFn: () => getUserDetails(id),
  });

  const handleSuccess = useCallback((updatedUserDetails) => {
    queryClient.setQueryData(['user-details-for-edit', id], updatedUserDetails);
    onSuccess(updatedUserDetails);
  }, [queryClient, id, onSuccess]);

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <EditUserForm userDetails={userDetails} onSuccess={handleSuccess} />
  );
}
