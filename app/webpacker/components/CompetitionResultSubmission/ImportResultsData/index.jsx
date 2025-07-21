import React, { useState } from 'react';
import {
  Accordion, Container, Message, Tab,
} from 'semantic-ui-react';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import UploadResultsJson from './UploadResultsJson';
import ImportWcaLiveResults from './ImportWcaLiveResults';

export default function Wrapper({
  competitionId,
  alreadyHasSubmittedResult,
  isAdminView,
}) {
  return (
    <WCAQueryClientProvider>
      <ImportResultsData
        competitionId={competitionId}
        alreadyHasSubmittedResult={alreadyHasSubmittedResult}
        isAdminView={isAdminView}
      />
    </WCAQueryClientProvider>
  );
}

function ImportResultsData({
  competitionId,
  alreadyHasSubmittedResult,
  isAdminView = false,
}) {
  const [activeAccordion, setActiveAccordion] = useState(!alreadyHasSubmittedResult);

  const onImportSuccess = () => {
    // Ideally page should not be reloaded, but this is currently required to re-render
    // the rails HTML portion. Once that rails HTML portion is also migrated to React,
    // then this reload will be removed.
    window.location.reload();
  };

  const panes = [
    {
      menuItem: 'Upload Results JSON',
      render: () => (
        <Tab.Pane>
          <UploadResultsJson
            competitionId={competitionId}
            isAdminView={isAdminView}
            onImportSuccess={onImportSuccess}
          />
        </Tab.Pane>
      ),
    },
    ...(isAdminView ? [{
      menuItem: 'Import WCA Live Results',
      render: () => (
        <Tab.Pane>
          <ImportWcaLiveResults
            competitionId={competitionId}
            onImportSuccess={onImportSuccess}
          />
        </Tab.Pane>
      ),
    }] : []),
  ];

  return (
    <Container fluid>
      <Accordion fluid styled>
        <Accordion.Title
          active={activeAccordion}
          onClick={() => setActiveAccordion((prevValue) => !prevValue)}
        >
          Import Results Data
        </Accordion.Title>
        <Accordion.Content active={activeAccordion}>
          <Message
            warning={alreadyHasSubmittedResult}
            info={!alreadyHasSubmittedResult}
          >
            {alreadyHasSubmittedResult
              ? 'Some results have already been uploaded before, importing results data again will override all of them!'
              : 'Please start by selecting a JSON file to import.'}
          </Message>
          <Tab panes={panes} />
        </Accordion.Content>
      </Accordion>
    </Container>
  );
}
