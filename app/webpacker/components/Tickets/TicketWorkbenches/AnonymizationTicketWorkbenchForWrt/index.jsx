import React, { useState } from 'react';
import {
  Button,
  Container, Grid, Header, Message, Step,
} from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import getDetailsBeforeAnonymization from './api/getDetailsBeforeAnonymization';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import VerifyAnonymizeDetails from './VerifyAnonymizeDetails';
import AnonymizeAction from './AnonymizeAction';
import ActionItems from './ActionItems';
import NonActionItems from './NonActionItems';

const ANONYMIZATION_QUERY_CLIENT = new QueryClient();

const STEPS = [
  '1. Verify details to be anonymized',
  '2. Non-action items to review',
  '3. Action items to perform',
  '4. Anonymize Action',
];

export default function AnonymizationTicketWorkbenchForWrt({ userId, wcaId }) {
  const {
    data, isLoading, isError,
  } = useQuery({
    queryKey: ['anonymizeDetails', userId, wcaId],
    queryFn: () => getDetailsBeforeAnonymization(userId, wcaId),
    enabled: Boolean(userId || wcaId),
  }, ANONYMIZATION_QUERY_CLIENT);
  const [step, setStep] = useState(0);

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  if (!data) {
    return <Message info>No user/person to anonymize.</Message>;
  }

  return (
    <Container>
      <Header>Anonymization Dashboard</Header>

      <Grid columns={2}>
        <Grid.Column>
          <Step.Group fluid vertical>
            {STEPS.map((stepName, index) => (
              <Step
                key={stepName}
                active={step === index}
                completed={step > index}
                onClick={() => setStep(index)}
              >
                <Step.Content>
                  <Step.Title>{stepName}</Step.Title>
                </Step.Content>
              </Step>
            ))}
          </Step.Group>
        </Grid.Column>
        <Grid.Column>
          <>
            <StepContent
              step={step}
              data={data}
              userId={userId}
              wcaId={wcaId}
            />
            <br />
            <Button.Group>
              {step > 0
                && <Button onClick={() => setStep(step - 1)}>Previous Step</Button>}
              {step < STEPS.length - 1
                && <Button onClick={() => setStep(step + 1)}>Next Step</Button>}
            </Button.Group>
          </>
        </Grid.Column>
      </Grid>
    </Container>
  );
}

function StepContent({
  step, data, userId, wcaId,
}) {
  switch (step) {
    case 0:
      return <VerifyAnonymizeDetails data={data} />;
    case 1:
      return (
        <NonActionItems
          nonActionItemList={data.non_action_items}
          messageArgs={data.message_args}
        />
      );
    case 2:
      return (
        <ActionItems
          actionItemList={data.action_items}
          messageArgs={data.message_args}
        />
      );
    case 3:
      return <AnonymizeAction data={data} userId={userId} wcaId={wcaId} />;
    default:
      return null;
  }
}
