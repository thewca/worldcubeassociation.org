import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
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
import { showMessage } from '../Register/RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

export default function Payments({
  onSuccess, registrationId, competitionId, competitorsInfo,
}) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const {
    data: payments,
    isLoading: paymentsLoading,
  } = useQuery({
    queryKey: ['payments', registrationId],
    queryFn: () => getRegistrationPayments(registrationId),
    select: (data) => data.charges.filter((r) => r.iso_amount_refundable !== 0),
  });

  const { mutate: refundMutation, isPending: isMutating } = useMutation({
    mutationFn: refundPayment,
    // The Backend will set a flash error on success or error
    onSuccess: (data) => {
      const { message, refunded_charge: refundedCharge } = data;

      // i18n-tasks-use t('payments.messages.charge_refunded')
      dispatch(showMessage(
        `payments.messages.${message}`,
        'positive',
      ));

      queryClient.setQueryData(
        ['payments', registrationId],
        (prevData) => ({
          charges: [
            ...prevData.charges.filter((ch) => ch.payment_id !== refundedCharge.payment_id),
            refundedCharge,
          ],
        }),
      );

      onSuccess();
    },
    onError: (data) => {
      const { error } = data.json;
      // i18n-tasks-use t('payments.errors.refund.provider_disconnected')
      // i18n-tasks-use t('payments.errors.refund.refund_amount_too_high')
      // i18n-tasks-use t('payments.errors.refund.refund_amount_too_low')
      dispatch(showMessage(
        `payments.errors.refund.${error}`,
        'negative',
      ));
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
  const [amountToRefund, setAmountToRefund] = useInputState(payment.iso_amount_refundable);

  const confirm = useConfirm();

  const attemptRefund = () => confirm({
    content: I18n.t('registrations.refund_confirmation'),
  }).then(() => {
    refundMutation({
      competitionId,
      paymentId: payment.payment_id,
      paymentProvider: payment.payment_provider,
      amount: amountToRefund,
    }, {
      onSuccess: (data) => {
        const { refunded_charge: refundedCharge } = data;

        setAmountToRefund(
          (prevAmount) => Math.min(prevAmount, refundedCharge.iso_amount_refundable),
        );
      },
    });
  });

  return (
    <>
      <Table.Row>
        <Table.Cell>
          {isoMoneyToHumanReadable(payment.iso_amount_refundable, payment.currency_code)}
        </Table.Cell>
        <Table.Cell>
          {isoMoneyToHumanReadable(payment.iso_amount_payment, payment.currency_code)}
        </Table.Cell>
        <Table.Cell>
          <AutonumericField
            currency={payment.currency_code.toUpperCase()}
            value={amountToRefund}
            onChange={setAmountToRefund}
            max={payment.iso_amount_refundable}
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
        <Table.Row key={p.payment_id}>
          <Table.Cell />
          <Table.Cell />
          <Table.Cell>
            {isoMoneyToHumanReadable(p.iso_amount_payment, p.currency_code)}
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
