import React from 'react';
import {
  Accordion,
  Icon, Message,
} from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import { useRegistration } from '../lib/RegistrationProvider';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import ManualPaymentStep from './ManualPaymentStep';
import StripePaymentStep from './StripePaymentStep';
import { hasPassed } from '../../../lib/utils/dates';

function PaymentMessage({
  message, icon, success, warning, negative,
}) {
  return (
    <Message icon success={success} warning={warning} negative={negative}>
      <Icon name={icon} />
      <Message.Content>
        {message}
      </Message.Content>
    </Message>
  );
}

function PaymentStatus({
  hasPaid, totalPaid, paymentFee, currencyCode, paymentReference,
}) {
  const totalPaidString = isoMoneyToHumanReadable(totalPaid, currencyCode);
  const paymentFeeString = isoMoneyToHumanReadable(paymentFee, currencyCode);

  if (paymentReference) {
    if (hasPaid) {
      return (
        <PaymentMessage
          message={I18n.t('registrations.approved_manual_payment', { payment_reference: paymentReference })}
          icon="checkmark"
          success
        />
      );
    }
    return (
      <PaymentMessage
        message={I18n.t('registrations.pending_manual_payment', { payment_reference: paymentReference })}
        icon={hasPaid ? 'checkmark' : 'warning circle'}
        warning
      />
    );
  }
  if (hasPaid) {
    return (
      <PaymentMessage
        message={I18n.t('registrations.entry_fees_fully_paid', { paid: totalPaidString })}
        icon="checkmark"
        success
      />
    );
  }
  if (totalPaid === 0) {
    return (
      <PaymentMessage
        message={I18n.t('registrations.entry_fees_fully_refunded')}
        icon="remove circle"
        negative
      />
    );
  }
  return (
    <PaymentMessage
      message={I18n.t('registrations.entry_fees_partially_paid', { paid: totalPaidString, total: paymentFeeString })}
      icon="warning circle"
      warning
    />
  );
}

export default function PaymentOverview({
  payments, competitionInfo, connectedAccountId, stripePublishableKey, user, nextStep,
}) {
  const { hasPaid, registration } = useRegistration();
  const totalPaid = _.sumBy(payments, 'iso_amount_refundable');
  const [payAgain, setPayAgain] = useCheckboxState(false);
  const paymentReference = registration.payment.payment_reference;

  const payAgainText = competitionInfo.payment_integration_type === 'manual'
    ? I18n.t('registrations.update_payment_ref')
    : I18n.t('registrations.entry_fees_pay_again');

  return (
    <>
      <PaymentStatus
        paymentFee={competitionInfo.base_entry_fee_lowest_denomination}
        hasPaid={hasPaid}
        totalPaid={totalPaid}
        currencyCode={competitionInfo.currency_code}
        paymentReference={paymentReference}
      />
      { !hasPaid && !hasPassed(competitionInfo.registration_close) && (
        <Accordion styled fluid>
          <Accordion.Title
            icon
            active={payAgain}
            index={0}
            onClick={() => setPayAgain((prev) => !prev)}
          >
            <Icon name="dropdown" />
            {payAgainText}
          </Accordion.Title>
          <Accordion.Content active={payAgain}>
            { competitionInfo.payment_integration_type === 'stripe' && (
              <StripePaymentStep
                competitionInfo={competitionInfo}
                connectedAccountId={connectedAccountId}
                nextStep={nextStep}
                stripePublishableKey={stripePublishableKey}
                user={user}
              />
            )}
            { competitionInfo.payment_integration_type === 'manual' && (
              <ManualPaymentStep
                competitionInfo={competitionInfo}
                nextStep={nextStep}
                userInfo={user}
              />
            )}
          </Accordion.Content>
        </Accordion>
      )}
    </>
  );
}
