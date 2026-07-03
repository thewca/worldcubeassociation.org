import React from 'react';
import { Message, Tab } from 'semantic-ui-react';
import UploadResultsJson from './UploadResultsJson';
import ImportWcaLiveResults from './ImportWcaLiveResults';

export default function ImportResultsData({
  competitionId,
  hasTemporaryResults,
  onImportSuccess,
  isAdminView = false,
  uploadedScrambleFilesCount = 0,
  showWcaLiveBeta = false,
}) {
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
    <>
      <Message
        warning={hasTemporaryResults}
        info={!hasTemporaryResults}
      >
        {hasTemporaryResults
          ? 'Some results have already been uploaded before, importing results data again will override all of them!'
          : 'Please start by selecting a JSON file to import.'}
      </Message>
      <Tab panes={panes} />
    </>
  );
}
