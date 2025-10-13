import React from 'react';
import { List, Message } from 'semantic-ui-react';
import { ImportResultsData } from './ImportResultsData';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import FormToWrt from './FormToWrt';

export default function Wrapper({
  competitionId,
  resultsSubmitted,
  hasTemporaryResults,
  uploadedScrambleFilesCount,
  showWcaLiveBeta,
  canSubmitResults,
}) {
  return (
    <WCAQueryClientProvider>
      <CompetitionResultSubmission
        competitionId={competitionId}
        resultsSubmitted={resultsSubmitted}
        hasTemporaryResults={hasTemporaryResults}
        uploadedScrambleFilesCount={uploadedScrambleFilesCount}
        showWcaLiveBeta={showWcaLiveBeta}
        canSubmitResults={canSubmitResults}
      />
    </WCAQueryClientProvider>
  );
}

function CompetitionResultSubmission({
  competitionId,
  resultsSubmitted,
  hasTemporaryResults,
  uploadedScrambleFilesCount,
  showWcaLiveBeta,
  canSubmitResults,
}) {
  if (resultsSubmitted) {
    return (
      <Message positive>
        The results have already been submitted. If you have any more questions or
        comments please reply to the email sent with the first results submission.
      </Message>
    );
  }

  return (
    <>
      The result submission process has two steps:
      <List ordered>
        <List.Item>
          Providing valid results data to the website.
          This can be done in one of the following ways:
          <List.List>
            <List.Item value="a">Uploading a Results JSON file</List.Item>
            {showWcaLiveBeta && (
              <List.Item value="b">Importing results directly from WCA Live</List.Item>
            )}
          </List.List>
        </List.Item>
        <List.Item>
          Submit these results to the WRT after addressing warnings (if any).
        </List.Item>
      </List>
      <ImportResultsData
        competitionId={competitionId}
        uploadedScrambleFilesCount={uploadedScrambleFilesCount}
        hasTemporaryResults={hasTemporaryResults}
        showWcaLiveBeta={showWcaLiveBeta}
      />
      {hasTemporaryResults && (
        <FormToWrt competitionId={competitionId} canSubmitResults={canSubmitResults} />
      )}
    </>
  );
}
