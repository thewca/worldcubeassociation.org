import React from 'react';
import { useQuery } from '@tanstack/react-query';
import getUserDetails from './api/getUserDetails';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import EditUserForm from './EditUserForm';

export default function EditUser({ id, onSuccess }) {
  const {
    data: userDetails,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['user-details-for-edit', id],
    queryFn: () => getUserDetails(id),
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <EditUserForm userDetails={userDetails} onSuccess={onSuccess} />
  );
}
