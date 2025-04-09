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

export default function ManualPaymentSetup({ competitionId }) {
  const [paymentInfo, setPaymentInfo] = useInputState('');
  const [paymentReference, setPaymentReference] = useInputState('');
  const [success, setSuccess] = useState(false);

  const { mutate } = useMutation({
    mutationFn: ({ info, reference }) => fetchJsonOrError(
      addManualPaymentIntegration(competitionId),
      {
        method: 'POST',
        body: JSON.stringify({ paymentInfo: info, paymentReference: reference }),
      },
    ),
    onSuccess: () => setSuccess(true),
  });

  return (
    <>
      <Header>
        {I18n.t('payments.payment_setup.manual_payments_header')}
      </Header>
      { success && (
        <Message possitve>
          Successfully created the manual payment integration.
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
      </Form>
    </>
  );
}
