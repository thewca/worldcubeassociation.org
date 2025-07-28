import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import {
  Button, Header, Message, Table,
} from 'semantic-ui-react';
import _ from 'lodash';
import getRegistrationPayments from '../api/payment/get/getRegistrationPayments';
import refundPayment from '../api/payment/get/refundPayment';
import Loading from '../../Requests/Loading';
import AutonumericField from '../../wca/FormBuilder/input/AutonumericField';
import I18n from '../../../lib/i18n';
import { showMessage } from '../Register/RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';
import getUsersInfo from '../api/user/post/getUserInfo';
import useInputState from '../../../lib/hooks/useInputState';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';

export default function RegistrationPayments({
  registrationId,
  competitionId,
}) {
  const {
    data: payments,
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ['registration-payments', registrationId],
    queryFn: () => getRegistrationPayments(registrationId),
    select: (data) => data.charges,
  });

  const { data: userInfo, isLoading: userInfoLoading } = useQuery({
    queryKey: ['payments-user', payments],
    queryFn: () => getUsersInfo(
      _.uniq(
        payments.flatMap((p) => [
          p.user_id,
          ...p.refunding_payments.map((r) => r.user_id),
        ]),
      ),
    ),
    enabled: Boolean(payments),
  });

  if (paymentsLoading || userInfoLoading) {
    return <Loading />;
  }

  return (
    <>
      <Header>
        {I18n.t('payments.header')}
        <Button floated="right" onClick={refetchPayments}>{I18n.t('misc.refresh')}</Button>
      </Header>
      <PaymentsMainBody
        registrationId={registrationId}
        payments={payments}
        competitionId={competitionId}
        userInfo={userInfo}
      />
    </>
  );
}

function PaymentsMainBody({
  registrationId,
  payments,
  competitionId,
  userInfo,
}) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

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
        ['registration-payments', registrationId],
        (prevData) => ({
          charges: [
            ...prevData.charges.filter((ch) => ch.payment_id !== refundedCharge.payment_id),
            refundedCharge,
          ],
        }),
      );

      queryClient.invalidateQueries({ queryKey: ['registration-history', registrationId] });
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

  if (payments.length === 0) {
    return <Message warning>{I18n.t('payments.messages.no_payments')}</Message>;
  }

  return (
    <>
      {payments.filter((r) => r.iso_amount_refundable !== 0).length === 0 && (
        <Message warning>{I18n.t('payments.messages.charges_refunded')}</Message>
      )}

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
              userInfo={userInfo}
            />
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

function PaymentRow({
  payment, refundMutation, isMutating, competitionId, userInfo,
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
        {payment.iso_amount_refundable !== 0 && (
          <>
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
          </>
        )}
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
            {userInfo.find(
              (c) => c.id === Number(p.user_id),
            )?.name}
          </Table.Cell>
        </Table.Row>
      ))}
    </>
  );
}
