import React from 'react';
import { List, Message } from 'semantic-ui-react';
import { ImportResultsData } from './ImportResultsData';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import FormToWrt from './FormToWrt';

export default function Wrapper(
  {
    competitionId, resultsSubmitted, hasTemporaryResults, canSubmitResults,
  },
) {
  return (
    <WCAQueryClientProvider>
      <CompetitionResultSubmission
        competitionId={competitionId}
        resultsSubmitted={resultsSubmitted}
        hasTemporaryResults={hasTemporaryResults}
        canSubmitResults={canSubmitResults}
      />
    </WCAQueryClientProvider>
  );
}

function CompetitionResultSubmission(
  {
    competitionId, resultsSubmitted, hasTemporaryResults, canSubmitResults,
  },
) {
  if (resultsSubmitted) {
    <Message positive>
      The results have already been submitted. If you have any more questions or
      comments please reply to the email sent with the first results submission.
    </Message>;
  }

  return (
    <>
      The result submission process has two steps:
      <List bulleted>
        <List.Item>
          Uploading a valid JSON to the website.
        </List.Item>
        <List.Item>
          Submit these results to the WRT after addressing warnings (if any).
        </List.Item>
      </List>
      <ImportResultsData
        competitionId={competitionId}
        hasTemporaryResults={hasTemporaryResults}
      />
      {hasTemporaryResults && (
        <FormToWrt competitionId={competitionId} canSubmitResults={canSubmitResults} />
      )}
    </>
  );
}
