import React from 'react';
import {
  Accordion, Button, Form, Message,
} from 'semantic-ui-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Errored from '../../Requests/Errored';
import useInputState from '../../../lib/hooks/useInputState';
import MarkdownEditor from '../../wca/FormBuilder/input/MarkdownEditor';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import submitToWrt from '../api/submitToWrt';
import importWcaLiveResults from '../api/importWcaLiveResults';
import Loading from '../../Requests/Loading';
import runValidatorsForCompetitionList from '../../Panel/pages/RunValidatorsPage/api/runValidatorsForCompetitionList';
import { ALL_VALIDATORS } from '../../../lib/wca-data.js.erb';
import ValidationOutput from '../../Panel/pages/RunValidatorsPage/ValidationOutput';

const DELEGATE_HANDBOOK_COMPETITION_RESULTS_URL = 'https://documents.worldcubeassociation.org/edudoc/delegate-handbook/delegate-handbook.pdf#competition-results';
const ERROR_MESSAGE_UPLOADED_RESULTS = "Please upload a JSON file and make sure the results don't contain any errors.";

export default function FormToWrt({ competitionId, canSubmitResults, showWcaLiveBeta = false }) {
  const [confirmDetails, setConfirmDetails] = useCheckboxState(false);
  const [message, setMessage] = useInputState();

  const {
    data: validationOutput,
    isPending: isValidationPending,
    isError: isErrorInPreviousUpload,
    isFetching: isValidationFetching,
    refetch: refetchValidation,
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
    mutate: reimportMutate,
    isPending: isReimportPending,
    isError: isReimportError,
    error: reimportError,
  } = useMutation({
    mutationFn: () => importWcaLiveResults({
      competitionId,
      markResultSubmitted: false,
      storeUploadedJson: true,
    }),
    onSuccess: () => refetchValidation(),
  });

  const {
    mutate: submitToWrtMutate,
    isPending: isSubmitPending,
    isSuccess,
    isError: isErrorInCurrentUpload,
    error: errorInSubmission,
  } = useMutation({ mutationFn: submitToWrt });

  const hasValidationErrors = validationOutput?.errors?.length > 0;
  const isRefreshing = isReimportPending || isValidationFetching;

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
        {showWcaLiveBeta && hasValidationErrors && (
          <Message warning>
            <p>
              If you are using WCA Live, hit
              {' '}
              <b>&quot;Synchronize&quot;</b>
              {' '}
              after fixing these errors, then re-import the times to refresh the validations below.
            </p>
            {isReimportError && <Errored error={reimportError} />}
            <Button
              primary
              loading={isRefreshing}
              disabled={isRefreshing}
              onClick={() => reimportMutate()}
            >
              Re-import & Refresh Validations
            </Button>
          </Message>
        )}
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
