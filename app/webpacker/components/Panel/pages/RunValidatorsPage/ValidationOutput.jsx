import React from 'react';
import { Header, Message } from 'semantic-ui-react';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import ValidationListView from './ValidationListView';

export default function ValidationOutput({
  validationOutput, isPending, isError, showCompetitionNameOnOutput,
}) {
  if (isPending) return <Loading />;
  if (isError) return <Errored />;

  if (!validationOutput) {
    return (
      <Message>Please run the validators to see the output.</Message>
    );
  }

  return (
    <>
      <Header>Validation Output</Header>
      {validationOutput.infos.length > 0 && (
        <>
          <Header as="h5">Infos</Header>
          <ValidationListView
            validations={validationOutput.infos}
            showCompetitionNameOnOutput={showCompetitionNameOnOutput}
            type="info"
          />
        </>
      )}
      <Header as="h5">Errors</Header>
      <ValidationErrorOutput
        validationOutput={validationOutput}
        showCompetitionNameOnOutput={showCompetitionNameOnOutput}
      />
      <Header as="h5">Warnings</Header>
      <ValidationWarningOutput
        validationOutput={validationOutput}
        showCompetitionNameOnOutput={showCompetitionNameOnOutput}
      />
    </>
  );
}

function ValidationErrorOutput({ validationOutput, showCompetitionNameOnOutput }) {
  const hasResults = validationOutput.has_results;
  const hasErrors = validationOutput.errors.length > 0;

  if (!hasErrors) {
    if (hasResults) {
      return <p>No error detected in the results.</p>;
    }
    return <p>No results for the competition yet.</p>;
  }

  return (
    <>
      <p>Please fix the errors below:</p>
      <ValidationListView
        validations={validationOutput.errors}
        showCompetitionNameOnOutput={showCompetitionNameOnOutput}
        type="error"
      />
    </>
  );
}

function ValidationWarningOutput({ validationOutput, showCompetitionNameOnOutput }) {
  const hasResults = validationOutput.has_results;
  const hasWarning = validationOutput.warnings.length > 0;

  if (!hasWarning) {
    if (hasResults) {
      return <p>No warning detected in the results.</p>;
    }
    return <p>No results for the competition yet.</p>;
  }

  return (
    <>
      <p>Please pay attention to the warnings below:</p>
      <ValidationListView
        validations={validationOutput.warnings}
        showCompetitionNameOnOutput={showCompetitionNameOnOutput}
        type="warning"
      />
    </>
  );
}
