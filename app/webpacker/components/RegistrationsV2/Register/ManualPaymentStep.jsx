import React from 'react';
import {
  Form, Header,
  Message,
  Segment,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import { hasPassed } from '../../../lib/utils/dates';
import useInputState from '../../../lib/hooks/useInputState';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import Markdown from '../../Markdown';
import { useRegistration } from '../lib/RegistrationProvider';
import { paymentFinishUrl } from '../../../lib/requests/routes.js.erb';
import getPaymentTicket from '../api/payment/get/getPaymentTicket';
import Loading from '../../Requests/Loading';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

export default function ManualPaymentStep({
  competitionInfo,
}) {
  const { hasPaid, registration } = useRegistration();

  const [paymentReference, setPaymentReference] = useInputState(hasPaid ? registration.payment.payment_reference : '');
  const [paymentConfirmation, setPaymentConfirmation] = useCheckboxState(hasPaid);

  const { data, isLoading } = useQuery({
    queryKey: ['manual-payment', competitionInfo.id],
    queryFn: () => getPaymentTicket(
      competitionInfo,
      competitionInfo.base_entry_fee_lowest_denomination,
      'manual',
    ),
  });

  if (hasPassed(competitionInfo.registration_close)) {
    return (
      <Message color="red">{I18n.t('registrations.payment_form.errors.registration_closed')}</Message>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Segment>
      <Header as="h2">{I18n.t('competitions.registration_v2.list.payment.payment_info')}</Header>
      <Message>
        <Markdown id="paymentInfo" md={competitionInfo.manual_payment_details.payment_information} />
      </Message>
      <Form id="manual-payment-form" action={paymentFinishUrl(competitionInfo.id, 'manual')} method="GET">
        <Form.Field required disabled={hasPaid}>
          <label htmlFor="paymentReference">{I18n.t('competitions.registration_v2.list.payment.payment_reference')}</label>
          <Form.Checkbox id="paymentConfirm" onChange={setPaymentConfirmation} checked={paymentConfirmation} label={I18n.t('competitions.registration_v2.list.payment.confirmation')} />
        </Form.Field>
        <Form.Field>
          <Header as="h5">{I18n.t('registrations.payment_form.labels.subtotal')}</Header>
          {isoMoneyToHumanReadable(
            competitionInfo.base_entry_fee_lowest_denomination,
            competitionInfo.currency_code,
          )}
        </Form.Field>
        <Form.Field required disabled={hasPaid}>
          <label htmlFor="paymentReference">{competitionInfo.manual_payment_details.payment_reference}</label>
          <Form.Input id="paymentReference" name="payment_reference" value={paymentReference} onChange={setPaymentReference} />
        </Form.Field>
        <Form.Button type="submit" disabled={hasPaid}>
          {I18n.t('registrations.payment_form.button_text')}
        </Form.Button>
        <input hidden name="client_secret" value={data.client_secret} />
      </Form>
    </Segment>
  );
}
