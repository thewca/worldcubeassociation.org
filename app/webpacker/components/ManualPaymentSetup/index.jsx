import React, { useState } from 'react';
import {
  Form, FormField, Header, Message,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';
import useInputState from '../../lib/hooks/useInputState';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { addManualPaymentIntegration } from '../../lib/requests/routes.js.erb';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <ManualPaymentSetup competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

function ManualPaymentSetup({ competitionId }) {
  const [paymentInfo, setPaymentInfo] = useInputState('');
  const [paymentReference, setPaymentReference] = useInputState('');
  const [error, setError] = useState(false);

  const { mutate, isSuccess } = useMutation({
    mutationFn: ({ info, reference }) => fetchJsonOrError(
      addManualPaymentIntegration(competitionId),
      {
        method: 'POST',
        body: JSON.stringify({ payment_info: info, payment_reference: reference }),
        headers: {
          'content-type': 'application/json',
        },
      },
    ),
    onError: (responseError) => { setError(responseError.json.error); },
  });

  return (
    <>
      <Header>
        {I18n.t('payments.payment_setup.manual_payments_header')}
      </Header>
      { isSuccess && (
        <Message positive>
          Successfully created the manual payment integration.
        </Message>
      )}
      { error && (
        <Message negative>
          <Message.Header>Failed with error</Message.Header>
          {error}
        </Message>
      )}
      <Form onSubmit={() => mutate({ info: paymentInfo, reference: paymentReference })}>
        <FormField>
          <label htmlFor="paymentInfo">{I18n.t('payments.payment_setup.account_details.manual.payment_info')}</label>
          <MarkdownEditor id="paymentInfo" value={paymentInfo} onChange={setPaymentInfo} imageUploadEnabled />
        </FormField>
        <FormField>
          <label htmlFor="paymentReference">{I18n.t('payments.payment_setup.account_details.manual.payment_reference')}</label>
          <Form.Input id="paymentReference" value={paymentReference} onChange={setPaymentReference} />
        </FormField>
        <Form.Button type="submit">
          Submit
        </Form.Button>
      </Form>
    </>
  );
}
