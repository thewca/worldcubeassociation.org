import React from 'react';
import { Form, Header } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';
import useInputState from '../../lib/hooks/useInputState';
import { paymentSetupUrl } from '../../lib/requests/routes.js.erb';

export default function ManualPaymentSetup({ competitionId }) {
  const [paymentInfo, setPaymentInfo] = useInputState('');
  const [paymentReference, setPaymentReference] = useInputState('');

  return (
    <>
      <Header>
        {I18n.t('payments.payment_setup.manual_payments_header')}
      </Header>
      <Form method="GET" action={paymentSetupUrl(competitionId, 'manual')}>
        <Form.Field
          label={I18n.t('payments.payment_setup.account_details.manual.payment_info')}
          control={MarkdownEditor}
          value={paymentInfo}
          onChange={setPaymentInfo}
          imageUploadEnabled
        />
        <input value={paymentInfo} name="payment_information" hidden />
        <Form.Input
          label={I18n.t('payments.payment_setup.account_details.manual.payment_reference')}
          name="payment_reference"
          value={paymentReference}
          onChange={setPaymentReference}
        />
        <Form.Button type="submit">
          Submit
        </Form.Button>
      </Form>
    </>
  );
}
