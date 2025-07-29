import React from 'react';
import { Accordion, Form, Message } from 'semantic-ui-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Errored from '../../Requests/Errored';
import useInputState from '../../../lib/hooks/useInputState';
import MarkdownEditor from '../../wca/FormBuilder/input/MarkdownEditor';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import submitToWrt from '../api/submitToWrt';
import Loading from '../../Requests/Loading';
import runValidatorsForCompetitionList from '../../Panel/pages/RunValidatorsPage/api/runValidatorsForCompetitionList';
import { ALL_VALIDATORS } from '../../../lib/wca-data.js.erb';
import ValidationOutput from '../../Panel/pages/RunValidatorsPage/ValidationOutput';

const DELEGATE_HANDBOOK_COMPETITION_RESULTS_URL = 'https://documents.worldcubeassociation.org/edudoc/delegate-handbook/delegate-handbook.pdf#competition-results';
const ERROR_MESSAGE_UPLOADED_RESULTS = "Please upload a JSON file and make sure the results don't contain any errors.";

export default function FormToWrt({ competitionId, canSubmitResults }) {
  const [confirmDetails, setConfirmDetails] = useCheckboxState(false);
  const [message, setMessage] = useInputState();

  const {
    data: validationOutput,
    isPending: isValidationPending,
    isError: isErrorInPreviousUpload,
  } = useQuery({
    queryKey: ['competition-validation-output', competitionId],
    queryFn: () => runValidatorsForCompetitionList(
      competitionId,
      ALL_VALIDATORS,
      false,
      false,
    ),
  });

  const {
    mutate: submitToWrtMutate,
    isPending: isSubmitPending,
    isSuccess,
    isError: isErrorInCurrentUpload,
    error: errorInSubmission,
  } = useMutation({ mutationFn: submitToWrt });

  const formSubmitHandler = () => {
    submitToWrtMutate({ competitionId, message });
  };

  if (isValidationPending || isSubmitPending) return <Loading />;
  if (isSuccess) return <Message success>Thank you for submitting the results!</Message>;
  if (isErrorInPreviousUpload) return <Errored error={ERROR_MESSAGE_UPLOADED_RESULTS} />;
  if (isErrorInCurrentUpload) return <Errored error={errorInSubmission} />;

  return (
    <Accordion fluid styled>
      <Accordion.Title active>
        Submit to WRT
      </Accordion.Title>
      <Accordion.Content active>
        <ValidationOutput validationOutput={validationOutput} />
        {canSubmitResults && (
          <>
            <p>Please enter the body of your email to the Results Team.</p>
            <p>
              Make sure the schedule on the WCA website actually reflects what happened during the
              competition.
            </p>
            <p>
              Please also make sure to include any other additional details required by the
              {' '}
              <a href={DELEGATE_HANDBOOK_COMPETITION_RESULTS_URL}>
                &apos;Competition Results&apos; section of the Delegate Handbook.
              </a>
            </p>
            <Form onSubmit={formSubmitHandler}>
              <MarkdownEditor
                id="message"
                value={message}
                onChange={setMessage}
              />
              <Form.Checkbox
                value={confirmDetails}
                onChange={setConfirmDetails}
                label="I confirm the information displayed on the WCA website's events page and on the competition's schedule page reflect what happened during the competition."
              />
              <Form.Button
                type="submit"
                disabled={!confirmDetails || !message}
              >
                Submit
              </Form.Button>
            </Form>
          </>
        )}
      </Accordion.Content>
    </Accordion>
  );
}
