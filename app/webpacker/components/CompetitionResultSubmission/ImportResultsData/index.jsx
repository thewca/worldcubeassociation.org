import React from 'react';
import { Message, Tab } from 'semantic-ui-react';
import UploadResultsJson from './UploadResultsJson';
import UploadWcifResults from './UploadWcifResults';
import ImportWcaLiveResults from './ImportWcaLiveResults';

export default function ImportResultsData({
  competitionId,
  hasTemporaryResults,
  scoretakingSoftware,
  onImportSuccess,
  isAdminView = false,
  uploadedScrambleFilesCount = 0,
  usesWcaRegistration = false,
}) {
  const panes = [
    // JSON exports carry the merged (global) ranking for Dual Rounds, so competitions
    //   scored with the internal scoretaking must import directly from Live instead.
    ...((isAdminView || scoretakingSoftware !== 'internal') ? [{
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
    ...((isAdminView || scoretakingSoftware !== 'external') ? [{
      menuItem: 'Upload WCIF results',
      render: () => (
        <Tab.Pane>
          <UploadWcifResults
            competitionId={competitionId}
            isAdminView={isAdminView}
            onImportSuccess={onImportSuccess}
            usesWcaRegistration={usesWcaRegistration}
          />
        </Tab.Pane>
      ),
    }] : []),
    ...((isAdminView || scoretakingSoftware !== 'external') ? [{
      menuItem: 'Use Live Results',
      render: () => (
        <Tab.Pane>
          <ImportWcaLiveResults
            competitionId={competitionId}
            uploadedScrambleFilesCount={uploadedScrambleFilesCount}
            isAdminView={isAdminView}
            onImportSuccess={onImportSuccess}
            scoretakingSoftware={scoretakingSoftware}
          />
        </Tab.Pane>
      ),
    }] : []),
  ];

  return (
    <>
      {hasTemporaryResults && (
        <Message warning>
          Some results have already been uploaded before,
          importing results data again will replace all of them!
        </Message>
      )}
      <Tab panes={panes} />
    </>
  );
}
