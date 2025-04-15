import React, from 'react';
import {
  Form, FormField, Header,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';
import useInputState from '../../lib/hooks/useInputState';
import { paymentSetupUrl } from '../../lib/requests/routes.js.erb';
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

  return (
    <>
      <Header>
        {I18n.t('payments.payment_setup.manual_payments_header')}
      </Header>
      <Form method="GET" action={paymentSetupUrl(competitionId, 'manual')}>
        <FormField>
          <label htmlFor="paymentInfo">{I18n.t('payments.payment_setup.account_details.manual.payment_info')}</label>
          <MarkdownEditor id="paymentInfo" value={paymentInfo} onChange={setPaymentInfo} imageUploadEnabled />
          <input value={paymentInfo} name="payment_information" hidden />
        </FormField>
        <FormField>
          <label htmlFor="paymentReference">{I18n.t('payments.payment_setup.account_details.manual.payment_reference')}</label>
          <Form.Input id="paymentReference" name="payment_reference" value={paymentReference} onChange={setPaymentReference} />
        </FormField>
        <Form.Button type="submit">
          Submit
        </Form.Button>
      </Form>
    </>
  );
}
