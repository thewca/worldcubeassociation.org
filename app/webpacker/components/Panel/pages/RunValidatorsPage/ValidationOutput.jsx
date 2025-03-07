import React from 'react';
import { Header, Message } from 'semantic-ui-react';
import _ from 'lodash';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import ValidationListView from './ValidationListView';

export default function ValidationOutput({
  validationOutput, isPending, isError, error, showCompetitionNameOnOutput,
}) {
  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  if (!validationOutput) {
    return (
      <Message>Please run the validators to see the output.</Message>
    );
  }

  return (
    <>
      <Header>Validation Output</Header>
      {['infos', 'errors', 'warnings'].map((validationType) => {
        const validations = validationOutput[validationType];
        // Validation output needs to be shown for warnings and errors even if there are no
        // validations.
        if (validations.length > 0 || validationType !== 'infos') {
          return (
            <>
              <Header as="h5">{_.startCase(validationType)}</Header>
              <ValidationListView
                validations={validationOutput[validationType]}
                showCompetitionNameOnOutput={showCompetitionNameOnOutput}
                type={validationType}
                hasResults={validationOutput.has_results}
              />
            </>
          );
        }
        return null;
      })}
    </>
  );
}
