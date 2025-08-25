import React from 'react';
import { Form, Header } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';
import useInputState from '../../lib/hooks/useInputState';
import { connectPaymentIntegrationUrl } from '../../lib/requests/routes.js.erb';

function utf8ToBase64(str) {
  // The best solution would be to use https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64
  // But it's not supported in some mainline browsers
  const utf8Bytes = new TextEncoder().encode(str);
  return btoa(String.fromCharCode(...utf8Bytes));
}

export default function ManualPaymentSetup({ competitionId, accountDetails = null }) {
  const [paymentInfo, setPaymentInfo] = useInputState(accountDetails?.payment_information);
  const [paymentReference, setPaymentReference] = useInputState(accountDetails?.payment_reference);

  return (
    <>
      <Header>
        {I18n.t('payments.payment_setup.manual_payments_header')}
      </Header>
      <Form method="GET" action={connectPaymentIntegrationUrl(competitionId, 'manual')}>
        <Form.Field
          label={I18n.t('payments.payment_setup.account_details.manual.payment_info')}
          control={MarkdownEditor}
          value={paymentInfo}
          onChange={setPaymentInfo}
          imageUploadEnabled
        />
        {/* Transport the Markdown covertly through Base64 to maintain line breaks */}
        <input value={utf8ToBase64(paymentInfo)} name="payment_information" hidden />
        <Form.Input
          label={I18n.t('payments.payment_setup.account_details.manual.payment_reference')}
          name="payment_reference"
          value={paymentReference}
          onChange={setPaymentReference}
        />
        <Form.Button primary type="submit">
          Submit
        </Form.Button>
      </Form>
    </>
  );
}
