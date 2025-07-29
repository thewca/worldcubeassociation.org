import React from 'react';
import { List, Message } from 'semantic-ui-react';
import { ImportResultsData } from './ImportResultsData';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import FormToWrt from './FormToWrt';

export default function Wrapper(
  {
    competitionId, resultsSubmitted, alreadyHasSubmittedResult, canSubmitResults,
  },
) {
  return (
    <WCAQueryClientProvider>
      <CompetitionResultSubmission
        competitionId={competitionId}
        resultsSubmitted={resultsSubmitted}
        alreadyHasSubmittedResult={alreadyHasSubmittedResult}
        canSubmitResults={canSubmitResults}
      />
    </WCAQueryClientProvider>
  );
}

function CompetitionResultSubmission(
  {
    competitionId, resultsSubmitted, alreadyHasSubmittedResult, canSubmitResults,
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
          Uploading a valid JSON to the website or use the results submitted via WCA Live
        </List.Item>
        <List.Item>
          Submit these results to the WRT after addressing warnings if any.
        </List.Item>
      </List>
      <ImportResultsData
        competitionId={competitionId}
        alreadyHasSubmittedResult={alreadyHasSubmittedResult}
      />
      {alreadyHasSubmittedResult && (
        <FormToWrt competitionId={competitionId} canSubmitResults={canSubmitResults} />
      )}
    </>
  );
}
