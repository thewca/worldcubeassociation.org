import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import Loading from '../../components/Requests/Loading';
import Errored from '../../components/Requests/Errored';
import EditProfileForm from './EditProfileForm';

export default function EditProfileFormHolder({
  wcaId,
  onContactSuccess,
  recaptchaPublicKey,
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profileData', wcaId],
    queryFn: () => fetchJsonOrError(apiV0Urls.persons.show(wcaId)),
  });

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  const profileDetails = data?.data?.person;

  return (
    <EditProfileForm
      wcaId={wcaId}
      profileDetails={profileDetails}
      onContactSuccess={onContactSuccess}
      recaptchaPublicKey={recaptchaPublicKey}
    />
  );
}
