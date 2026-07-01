import React from 'react';
import { Container, Message, Tab } from 'semantic-ui-react';
import UploadResultsJson from './UploadResultsJson';
import ImportWcaLiveResults from './ImportWcaLiveResults';

export default function ImportResultsData({
  competitionId,
  hasTemporaryResults,
  isAdminView = false,
  uploadedScrambleFilesCount = 0,
  showWcaLiveBeta = false,
}) {
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
            isAdminView={isAdminView}
            onImportSuccess={onImportSuccess}
          />
        </Tab.Pane>
      ),
    }] : []),
  ];

  return (
    <Container fluid>
      <Message
        warning={hasTemporaryResults}
        info={!hasTemporaryResults}
      >
        {hasTemporaryResults
          ? 'Some results have already been uploaded before, importing results data again will override all of them!'
          : 'Please start by selecting a JSON file to import.'}
      </Message>
      <Tab panes={panes} />
    </Container>
  );
}
