import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon, Message } from 'semantic-ui-react';
import getRegistrationPayments from '../api/payment/get/getRegistrationPayments';
import Loading from '../../Requests/Loading';
import I18n from '../../../lib/i18n';
import { useRegistration } from '../lib/RegistrationProvider';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

export default function PaymentOverview() {
  const { registration } = useRegistration();

  const {
    data: payments,
    isLoading,
  } = useQuery({
    queryKey: ['payments', registration.id],
    queryFn: () => getRegistrationPayments(registration.id),
    select: (data) => data.charges.filter((r) => r.ruby_amount_refundable !== 0),
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Message success icon>
      <Icon name="checkmark" />
      <Message.Content>
        {I18n.t('registrations.entry_fees_fully_paid', { paid: isoMoneyToHumanReadable(_.sumBy(payments, 'iso_amount_refundable'), payments[0].currency_code) })}
      </Message.Content>
    </Message>
  );
}
