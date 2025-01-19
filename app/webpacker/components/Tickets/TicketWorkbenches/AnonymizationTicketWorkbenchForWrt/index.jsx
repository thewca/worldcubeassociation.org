import React from 'react';
import { Container, Header, Message } from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import getDetailsBeforeAnonymization from './api/getDetailsBeforeAnonymization';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import VerifyAnonymizeDetails from './VerifyAnonymizeDetails';
import ReviewSystemGeneratedChecks from './ReviewSystemGeneratedChecks';
import PerformManualChecks from './PerformManualChecks';
import AnonymizeAction from './AnonymizeAction';

const ANONYMIZATION_QUERY_CLIENT = new QueryClient();

export default function AnonymizationTicketWorkbenchForWrt({ userId, wcaId }) {
  const {
    data, isLoading, isError,
  } = useQuery({
    queryKey: ['anonymizeDetails', userId, wcaId],
    queryFn: () => getDetailsBeforeAnonymization(userId, wcaId),
    enabled: Boolean(userId || wcaId),
  }, ANONYMIZATION_QUERY_CLIENT);

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  if (!data) {
    return <Message info>No user/person to anonymize.</Message>;
  }

  return (
    <Container>
      <Header>Anonymization Dashboard</Header>

      <Header as="h5">Step 1: Verify details to be anonymized</Header>
      <VerifyAnonymizeDetails data={data} />

      <Header as="h5">Step 2: Review system generated checks</Header>
      <ReviewSystemGeneratedChecks data={data} />

      <Header as="h5">Step 3: Perform manual checks</Header>
      <PerformManualChecks data={data} />

      <Header as="h5">Step 4: Anonymize Action</Header>
      <AnonymizeAction data={data} userId={userId} wcaId={wcaId} />

    </Container>
  );
}
