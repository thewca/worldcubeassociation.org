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
  canSubmitResults,
  scoretakingSoftware,
}) {
  return (
    <WCAQueryClientProvider>
      <CompetitionResultSubmission
        competitionId={competitionId}
        resultsSubmitted={resultsSubmitted}
        hasTemporaryResults={hasTemporaryResults}
        uploadedScrambleFilesCount={uploadedScrambleFilesCount}
        canSubmitResults={canSubmitResults}
        scoretakingSoftware={scoretakingSoftware}
      />
    </WCAQueryClientProvider>
  );
}

function CompetitionResultSubmission({
  competitionId,
  resultsSubmitted,
  hasTemporaryResults,
  uploadedScrambleFilesCount,
  canSubmitResults,
  scoretakingSoftware,
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
            {scoretakingSoftware !== 'external' && (
              <List.Item value="a">Importing results directly from Live Results</List.Item>
            )}
            {scoretakingSoftware !== 'internal' && (
              <List.Item value="a">Uploading a Results JSON file</List.Item>
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
        scoretakingSoftware={scoretakingSoftware}
      />
      {hasTemporaryResults && (
        <FormToWrt competitionId={competitionId} canSubmitResults={canSubmitResults} />
      )}
    </>
  );
}
