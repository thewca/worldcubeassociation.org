import React from 'react';
import { Button, Form } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import ValidationOutput from '../Panel/pages/RunValidatorsPage/ValidationOutput';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import { ALL_VALIDATORS } from '../../lib/wca-data.js.erb';
import runValidatorsForCompetitionList
  from '../Panel/pages/RunValidatorsPage/api/runValidatorsForCompetitionList';

export default function CheckValidations({
  competitionId,
  hasTemporaryResults,
  onUserConfirmed,
}) {
  const [isCheckboxTicked, setCheckboxTicked] = useCheckboxState(false);

  const {
    data: validationOutput,
    isFetching: isValidationFetching,
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

  const hasValidationErrors = validationOutput && validationOutput.errors.length > 0;

  return (
    <>
      <Button
        primary
        floated="right"
        icon="refresh"
        content="Refresh validations"
        onClick={() => refetchValidationOutput()}
      />
      <ValidationOutput
        validationOutput={validationOutput}
        isPending={isValidationFetching}
        isError={isValidationFetchError}
        error={validationFetchError}
      />
      {!isValidationFetching && !hasValidationErrors && (
        <Form onSubmit={onUserConfirmed}>
          <Form.Checkbox
            label="I confirm that all warnings are in order"
            checked={isCheckboxTicked}
            onChange={setCheckboxTicked}
            required
          />
          <Form.Button
            disabled={!isCheckboxTicked}
            onClick={onUserConfirmed}
          >
            Continue
          </Form.Button>
        </Form>
      )}
    </>
  );
}
