import React from 'react';
import { Accordion, Header } from 'semantic-ui-react';
import RunValidatorsForm from '../../Panel/pages/RunValidatorsPage/RunValidatorsForm';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import CompetitionResults from '../../ResultsData/Results';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <CheckExistingResults competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

function CheckExistingResults({ competitionId }) {
  return (
    <>
      <Header>Check results</Header>
      <p>Check existing results for the competition.</p>
      <RunValidatorsForm competitionIds={[competitionId]} />
      <Accordion fluid styled>
        <Accordion.Title>Preview imported results</Accordion.Title>
        <Accordion.Content active>
          <CompetitionResults competitionId={competitionId} />
        </Accordion.Content>
      </Accordion>
    </>
  );
}
