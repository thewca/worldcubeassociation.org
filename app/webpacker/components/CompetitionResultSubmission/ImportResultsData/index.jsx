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
  uploadedScrambleFilesCount,
}) {
  return (
    <WCAQueryClientProvider>
      <ImportResultsData
        competitionId={competitionId}
        hasTemporaryResults={alreadyHasSubmittedResult}
        isAdminView={isAdminView}
        uploadedScrambleFilesCount={uploadedScrambleFilesCount}
      />
    </WCAQueryClientProvider>
  );
}

export function ImportResultsData({
  competitionId,
  hasTemporaryResults,
  isAdminView = false,
  uploadedScrambleFilesCount = 0,
  showWcaLiveBeta = false,
}) {
  const [activeAccordion, setActiveAccordion] = useState(!hasTemporaryResults);

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
    ...((isAdminView || showWcaLiveBeta) ? [{
      menuItem: '[BETA] Use WCA Live Results',
      render: () => (
        <Tab.Pane>
          <ImportWcaLiveResults
            competitionId={competitionId}
            uploadedScrambleFilesCount={uploadedScrambleFilesCount}
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
            warning={hasTemporaryResults}
            info={!hasTemporaryResults}
          >
            {hasTemporaryResults
              ? 'Some results have already been uploaded before, importing results data again will override all of them!'
              : 'Please start by selecting a JSON file to import.'}
          </Message>
          <Tab panes={panes} />
        </Accordion.Content>
      </Accordion>
    </Container>
  );
}
