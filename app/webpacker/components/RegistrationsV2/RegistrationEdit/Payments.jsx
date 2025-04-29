import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import {
  Button, Message, Table,
} from 'semantic-ui-react';
import getRegistrationPayments from '../api/payment/get/getRegistrationPayments';
import refundPayment from '../api/payment/get/refundPayment';
import Loading from '../../Requests/Loading';
import AutonumericField from '../../wca/FormBuilder/input/AutonumericField';
import useInputState from '../../../lib/hooks/useInputState';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import I18n from '../../../lib/i18n';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

export default function Payments({
  onSuccess, registrationId, competitionId, competitorsInfo,
}) {
  const {
    data: payments,
    isLoading: paymentsLoading,
    refetch,
  } = useQuery({
    queryKey: ['payments', registrationId],
    queryFn: () => getRegistrationPayments(registrationId),
    select: (data) => data.charges.filter((r) => r.ruby_amount_refundable !== 0),
  });
  const { mutate: refundMutation, isPending: isMutating } = useMutation({
    mutationFn: refundPayment,
    // The Backend will set a flash error on success or error
    onSuccess: () => {
      refetch();
      onSuccess();
    },
  });

  if (paymentsLoading) {
    return <Loading />;
  }

  if (payments.length === 0) {
    return <Message warning>{I18n.t('payments.messages.charges_refunded')}</Message>;
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{I18n.t('payments.labels.net_payment')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('payments.labels.original_payment')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('registrations.refund_form.labels.refund_amount')}</Table.HeaderCell>
          <Table.HeaderCell />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {payments.map((refund) => (
          <PaymentRow
            payment={refund}
            refundMutation={refundMutation}
            isMutating={isMutating}
            competitionId={competitionId}
            key={refund.payment_id}
            competitorsInfo={competitorsInfo}
          />
        ))}
      </Table.Body>
    </Table>
  );
}

function PaymentRow({
  payment, refundMutation, isMutating, competitionId, competitorsInfo,
}) {
  const [amountToRefund, setAmountToRefund] = useInputState(payment.ruby_amount_refundable);

  // React state persists across rerenders, so `amountToRefund` would keep old values
  // which is problematic when refunding more than 50% of the original
  // (because then the input exceeds the new max, leading to a whole new tragedy with AN)
  useEffect(() => {
    setAmountToRefund((prevAmount) => Math.min(prevAmount, payment.ruby_amount_refundable));
  }, [payment.ruby_amount_refundable, setAmountToRefund]);

  const confirm = useConfirm();

  const attemptRefund = () => confirm({
    content: I18n.t('registrations.refund_confirmation'),
  }).then(() => {
    refundMutation({
      competitionId,
      paymentId: payment.payment_id,
      paymentProvider: payment.payment_provider,
      amount: amountToRefund,
    });
  });

  return (
    <>
      <Table.Row>
        <Table.Cell>
          {payment.human_amount_refundable}
        </Table.Cell>
        <Table.Cell>
          {payment.human_amount_payment}
        </Table.Cell>
        <Table.Cell>
          <AutonumericField
            currency={payment.currency_code.toUpperCase()}
            value={amountToRefund}
            onChange={setAmountToRefund}
            max={payment.ruby_amount_refundable}
          />
        </Table.Cell>
        <Table.Cell>
          <Button
            onClick={attemptRefund}
            disabled={isMutating}
          >
            {I18n.t('registrations.refund')}
          </Button>
        </Table.Cell>
      </Table.Row>
      {payment.refunding_payments.map((p) => (
        <Table.Row>
          <Table.Cell />
          <Table.Cell />
          <Table.Cell>
            {isoMoneyToHumanReadable(Math.abs(p.amount_lowest_denomination), p.currency_code)}
          </Table.Cell>
          <Table.Cell>
            Refunded by
            {' '}
            {competitorsInfo.find(
              (c) => c.id === Number(p.user_id),
            )?.name}
          </Table.Cell>
        </Table.Row>
      ))}
    </>
  );
}
