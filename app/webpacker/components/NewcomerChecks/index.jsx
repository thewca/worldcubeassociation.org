import React from 'react';
import { Container, Tab } from 'semantic-ui-react';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import DuplicateChecker from './DuplicateChecker';
import NameFormatChecker from './NameFormatChecker';
import DobChecker from './DobChecker';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <NewcomerChecks competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

function NewcomerChecks({ competitionId }) {
  const panes = [
    {
      menuItem: 'Duplicate Checker',
      render: () => (
        <Tab.Pane>
          <DuplicateChecker competitionId={competitionId} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Name Formats Checker',
      render: () => (
        <Tab.Pane>
          <NameFormatChecker competitionId={competitionId} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'DOB Checker',
      render: () => (
        <Tab.Pane>
          <DobChecker competitionId={competitionId} />
        </Tab.Pane>
      ),
    },
  ];

  return (
    <Container fluid>
      <Tab panes={panes} />
    </Container>
  );
}
