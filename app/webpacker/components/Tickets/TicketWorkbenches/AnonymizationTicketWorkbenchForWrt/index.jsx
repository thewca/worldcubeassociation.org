import React, { useState } from 'react';
import {
  Button,
  Container, Grid, Header, List, Message, Step,
} from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import getDetailsBeforeAnonymization from './api/getDetailsBeforeAnonymization';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import VerifyAnonymizeDetails from './VerifyAnonymizeDetails';
import AnonymizeAction from './AnonymizeAction';
import { competitionUrl } from '../../../../lib/requests/routes.js.erb';

const ANONYMIZATION_QUERY_CLIENT = new QueryClient();

const STEPS = [
  'Verify details to be anonymized',
  'Non-action items to review',
  'Action items to perform',
  'Anonymize Action',
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
          <Step.Group fluid vertical ordered>
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
        <List bulleted>
          {data.non_action_items.map((nonActionItem) => (
            <List.Item>
              <NonActionItemContent nonActionItem={nonActionItem} messageArgs={data.message_args} />
            </List.Item>
          ))}
        </List>
      );
    case 2:
      return (
        <List bulleted>
          {data.action_items.map((actionItem) => (
            <List.Item>
              <ActionItemContent actionItem={actionItem} messageArgs={data.message_args} />
            </List.Item>
          ))}
        </List>
      );
    case 3:
      return <AnonymizeAction data={data} userId={userId} wcaId={wcaId} />;
    default:
      return null;
  }
}

function NonActionItemContent({ nonActionItem }) {
  switch (nonActionItem) {
    case 'user_currently_banned':
      return 'This user is currently not banned.';
    case 'user_banned_in_past':
      return "This person wasn't banned in the past.";
    case 'person_has_records_in_past':
      return 'This person has never held any records.';
    case 'person_held_championship_podiums':
      return 'This person has never been on the podium at the World, Continental, or National Championships.';
    case 'person_competed_in_last_3_months':
      return 'This person has not competed in the last 3 months, so no need to check with the Delegates on whether any outstanding is there.';
    case 'user_may_have_forum_account':
      return 'There is no user to check for a WCA forum account.';
    case 'user_has_active_oauth_access_grants':
      return 'This user has no active OAuth access grants.';
    case 'competitions_with_external_website':
      return 'There are no competitions with external websites.';
    case 'recent_competitions_data_to_be_removed_wca_live':
      return 'There are no recent competitions data to be removed from WCA Live.';
    default:
      return `Unknown data (${nonActionItem}), please contact WST.`;
  }
}

function ActionItemContent({ actionItem, messageArgs }) {
  switch (actionItem) {
    case 'user_currently_banned':
      return 'This user is currently banned and cannot be anonymized.';
    case 'user_banned_in_past':
      return 'This person has been banned in the past, please email WIC and WRT to discuss whether to proceed with the anonymization.';
    case 'person_has_records_in_past':
      return `This person held ${messageArgs?.records?.world} World Records, ${messageArgs?.records?.continental} Contential Records, and ${messageArgs?.records?.national} National Records.`;
    case 'person_held_championship_podiums':
      return `This person has achieved World Championship podium ${messageArgs?.championshipPodiums?.world?.length} times, Continental Championship podium ${messageArgs?.championshipPodiums?.continental?.length} times, and National Championship podium ${messageArgs?.championshipPodiums?.national?.length} times.`;
    case 'person_competed_in_last_3_months':
      return (
        <>
          This person has competed in the last 3 months, please verify with the delegates
          that there is nothing outstanding regarding the competitor&apos;s involvement in
          these WCA competitions:
          <List ordered>
            {messageArgs?.recent_competitions_3_months?.map((competition) => (
              <List.Item key={competition.id}>
                <>
                  {'Contact '}
                  <a href={competitionUrl(competition.id)}>{competition.name}</a>
                  {' - '}
                  <a
                    href={`mailto:${competition.delegates.map((delegate) => delegate.email).join(',')}`}
                  >
                    {competition.delegates.map((delegate) => delegate.name).join(', ')}
                  </a>
                </>
              </List.Item>
            ))}
          </List>
        </>
      );
    case 'user_may_have_forum_account':
      return 'If you are an administrator of the WCA forum, search active users (https://forum.worldcubeassociation.org/admin/users/list/active) for any users using this email and anonymize their data. If you are not an administrator of the WCA forum, please ask a WRT member with administrator access to perform this step.';
    case 'user_has_active_oauth_access_grants':
      return (
        <>
          Request data removal from the following OAuth Access Grants:
          <List ordered>
            {messageArgs?.access_grants?.map((grant) => (
              <List.Item key={grant.id}>
                <>
                  {`${grant.application.name} - ${grant.application.redirect_uri} - `}
                  <a
                    href={`mailto:${grant.application.owner.email}`}
                  >
                    {grant.application.owner.name}
                  </a>
                </>
              </List.Item>
            ))}
          </List>
        </>
      );
    case 'competitions_with_external_website':
      return (
        <>
          Inspect external websites of competitions for data usage. If so, instruct the website
          to remove the person&apos;s data:
          <List ordered>
            {messageArgs?.competitions_with_external_website?.map((competition) => (
              <List.Item key={competition.id}>
                <>
                  <a href={competitionUrl(competition.id)}>{competition.name}</a>
                  {' - '}
                  <a href={competition.website}>{competition.website}</a>
                </>
              </List.Item>
            ))}
          </List>
        </>
      );
    case 'recent_competitions_data_to_be_removed_wca_live':
      return (
        <>
          This person has competed in the last 3 months. After anonymizing the person&apos;s data,
          synchronize the results on WCA Live (data more than 3 months old are automatically removed
          from WCA Live).
          <List ordered>
            {messageArgs?.recent_competitions_3_months?.map((competition) => (
              <List.Item key={competition.id}>
                <a href={competitionUrl(competition.id)}>{competition.name}</a>
              </List.Item>
            ))}
          </List>
        </>
      );
    case 'person_has_upcoming_registered_competitions':
      return (
        <>
          This person has upcoming registered competitions. Please Take care of it.
          <List ordered>
            {messageArgs?.upcoming_registered_competitions?.map((competition) => (
              <List.Item key={competition.id}>
                <a href={competitionUrl(competition.id)}>{competition.name}</a>
              </List.Item>
            ))}
          </List>
        </>
      );
    default:
      return `Unknown data (${actionItem}), please contact WST.`;
  }
}
