import React from 'react';
import { Icon, Message, Step } from 'semantic-ui-react';
import ImportResultsData from './ImportResultsData';
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
      <Step.Group ordered widths={3}>
        <Step>
          <Icon name="cloud upload" />
          <Step.Content>
            <Step.Title>Results Data</Step.Title>
            <Step.Description>
              Upload a file
              {showWcaLiveBeta && ' or WCA Live data'}
            </Step.Description>
          </Step.Content>
        </Step>
        <Step>
          <Icon name="warning sign" />
          <Step.Content>
            <Step.Title>Validations</Step.Title>
            <Step.Description>Address any warnings or errors</Step.Description>
          </Step.Content>
        </Step>
        <Step>
          <Icon name="cloud upload" />
          <Step.Content>
            <Step.Title>Submit</Step.Title>
            <Step.Description>Make the final submission to WRT</Step.Description>
          </Step.Content>
        </Step>
      </Step.Group>
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
