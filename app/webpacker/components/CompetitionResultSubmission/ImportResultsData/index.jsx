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
  usesInternalScoretaking = false,
}) {
  const [activeAccordion, setActiveAccordion] = useState(!hasTemporaryResults);

  const onImportSuccess = () => {
    // Ideally page should not be reloaded, but this is currently required to re-render
    // the rails HTML portion. Once that rails HTML portion is also migrated to React,
    // then this reload will be removed.
    window.location.reload();
  };

  const panes = [
    // JSON exports carry the merged (global) ranking for Dual Rounds, so competitions
    //   scored with the internal scoretaking must import directly from Live instead.
    ...((isAdminView || !usesInternalScoretaking) ? [{
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
    }] : []),
    ...((isAdminView || usesInternalScoretaking) ? [{
      menuItem: 'Use ILR Results',
      render: () => (
        <Tab.Pane>
          <ImportWcaLiveResults
            competitionId={competitionId}
            uploadedScrambleFilesCount={uploadedScrambleFilesCount}
            isAdminView={isAdminView}
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
