import React from 'react';
import { Form } from 'semantic-ui-react';
import ValidationOutput from '../Panel/pages/RunValidatorsPage/ValidationOutput';
import useCheckboxState from '../../lib/hooks/useCheckboxState';

export default function CheckValidations({
  validationOutput,
  isValidationPending,
  isValidationFetchError,
  validationFetchError,
  onUserConfirmed,
}) {
  const [isCheckboxTicked, setCheckboxTicked] = useCheckboxState(false);

  const hasValidationErrors = validationOutput && validationOutput.errors.length > 0;

  return (
    <>
      <ValidationOutput
        validationOutput={validationOutput}
        isPending={isValidationPending}
        isError={isValidationFetchError}
        error={validationFetchError}
      />
      {!hasValidationErrors && (
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
