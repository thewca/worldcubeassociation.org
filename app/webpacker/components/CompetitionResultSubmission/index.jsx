import React, { useCallback, useState } from 'react';
import { Icon, Message, Step } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import ImportResultsData from './ImportResultsData';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import FormToWrt from './FormToWrt';
import ValidationOutput from '../Panel/pages/RunValidatorsPage/ValidationOutput';
import runValidatorsForCompetitionList
  from '../Panel/pages/RunValidatorsPage/api/runValidatorsForCompetitionList';
import { ALL_VALIDATORS } from '../../lib/wca-data.js.erb';

export default function Wrapper({
  competitionId,
  areResultsSubmitted,
  hasTemporaryResults,
  uploadedScrambleFilesCount,
  showWcaLiveBeta,
  canSubmitResults,
}) {
  return (
    <WCAQueryClientProvider>
      <CompetitionResultSubmission
        competitionId={competitionId}
        areResultsSubmitted={areResultsSubmitted}
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
  areResultsSubmitted: areResultsSubmittedInitial,
  hasTemporaryResults: hasTemporaryResultsInitial,
  uploadedScrambleFilesCount,
  showWcaLiveBeta,
  canSubmitResults,
}) {
  // eslint-disable-next-line no-nested-ternary
  const defaultStep = areResultsSubmittedInitial ? 3 : (hasTemporaryResultsInitial ? 1 : 0);

  const [activeStep, setActiveStep] = useState(defaultStep);

  const [areResultsSubmitted, setAreResultsSubmitted] = useState(areResultsSubmittedInitial);
  const [hasTemporaryResults, setHasTemporaryResults] = useState(hasTemporaryResultsInitial);

  const {
    data: validationOutput,
    isPending: isValidationPending,
    isError: isValidationFetchError,
    error: validationFetchError,
    refetch: refetchValidationOutput,
  } = useQuery({
    queryKey: ['competition-validation-output', competitionId],
    queryFn: () => runValidatorsForCompetitionList(
      competitionId,
      ALL_VALIDATORS,
      false,
      false,
    ),
    enabled: hasTemporaryResults,
  });

  const advanceStep = useCallback(
    () => setActiveStep((stepWas) => stepWas + 1),
    [setActiveStep],
  );

  const onImportComplete = useCallback((response) => {
    refetchValidationOutput();

    setHasTemporaryResults(!!response.success);
    advanceStep();
  }, [setHasTemporaryResults, refetchValidationOutput, advanceStep]);

  return (
    <>
      <Step.Group widths={3}>
        <Step
          active={activeStep === 0}
          completed={activeStep > 0}
          onClick={() => setActiveStep(0)}
          disabled={areResultsSubmitted}
        >
          <Icon name="cloud upload" />
          <Step.Content>
            <Step.Title>Results Data</Step.Title>
            <Step.Description>
              Upload a file
              {showWcaLiveBeta && ' or WCA Live data'}
            </Step.Description>
          </Step.Content>
        </Step>
        <Step
          active={activeStep === 1}
          completed={activeStep > 1}
          onClick={() => setActiveStep(1)}
          disabled={areResultsSubmitted}
        >
          <Icon name="warning sign" />
          <Step.Content>
            <Step.Title>Validations</Step.Title>
            <Step.Description>Address any warnings or errors</Step.Description>
          </Step.Content>
        </Step>
        <Step
          active={activeStep === 2}
          completed={activeStep > 2}
          onClick={() => setActiveStep(2)}
          disabled={areResultsSubmitted}
        >
          <Icon name="cloud upload" />
          <Step.Content>
            <Step.Title>Submit</Step.Title>
            <Step.Description>Make the final submission to WRT</Step.Description>
          </Step.Content>
        </Step>
      </Step.Group>
      {activeStep === 0 && (
        <ImportResultsData
          competitionId={competitionId}
          uploadedScrambleFilesCount={uploadedScrambleFilesCount}
          hasTemporaryResults={hasTemporaryResults}
          showWcaLiveBeta={showWcaLiveBeta}
          onImportSuccess={onImportComplete}
        />
      )}
      {activeStep === 1 && (
        <ValidationOutput
          validationOutput={validationOutput}
          isPending={isValidationPending}
          isError={isValidationFetchError}
          error={validationFetchError}
        />
      )}
      {activeStep === 2 && (
        <FormToWrt
          competitionId={competitionId}
          canSubmitResults={canSubmitResults}
        />
      )}
      {activeStep === 3 && (
        <Message positive>
          The results have already been submitted. If you have any more questions or
          comments please reply to the email sent with the first results submission.
        </Message>
      )}
    </>
  );
}
