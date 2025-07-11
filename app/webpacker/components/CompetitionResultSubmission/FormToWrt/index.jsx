import React, { useState } from 'react';
import { Accordion, Form, Message } from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import Errored from '../../Requests/Errored';
import useInputState from '../../../lib/hooks/useInputState';
import MarkdownEditor from '../../wca/FormBuilder/input/MarkdownEditor';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import submitToWrt from '../api/submitToWrt';
import Loading from '../../Requests/Loading';

const DELEGATE_HANDBOOK_COMPETITION_RESULTS_URL = 'https://documents.worldcubeassociation.org/edudoc/delegate-handbook/delegate-handbook.pdf#competition-results';
const ERROR_MESSAGE_UPLOADED_RESULTS = "Please upload a JSON file and make sure the results don't contain any errors.";

export default function Wrapper({ competitionId, isErrorInPreviousUpload }) {
  return (
    <WCAQueryClientProvider>
      <FormToWrt
        competitionId={competitionId}
        isErrorInPreviousUpload={isErrorInPreviousUpload}
      />
    </WCAQueryClientProvider>
  );
}

function FormToWrt({ competitionId, isErrorInPreviousUpload }) {
  const [activeAccordion, setActiveAccordion] = useState(!isErrorInPreviousUpload);

  const [confirmDetails, setConfirmDetails] = useCheckboxState(false);
  const [message, setMessage] = useInputState();

  const {
    mutate: submitToWrtMutate,
    isPending,
    isSuccess,
    isError: isErrorInCurrentUpload,
    error: errorInSubmission,
  } = useMutation({ mutationFn: submitToWrt });

  const formSubmitHandler = () => {
    submitToWrtMutate({ competitionId, message });
  };

  if (isPending) return <Loading />;
  if (isSuccess) return <Message success>Thank you for submitting the results!</Message>;
  if (isErrorInPreviousUpload) return <Errored error={ERROR_MESSAGE_UPLOADED_RESULTS} />;
  if (isErrorInCurrentUpload) return <Errored error={errorInSubmission} />;

  return (
    <Accordion fluid styled>
      <Accordion.Title
        active={activeAccordion}
        onClick={() => setActiveAccordion((prevValue) => !prevValue)}
      >
        Submit to WRT
      </Accordion.Title>
      <Accordion.Content active={activeAccordion}>
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
      </Accordion.Content>
    </Accordion>
  );
}
