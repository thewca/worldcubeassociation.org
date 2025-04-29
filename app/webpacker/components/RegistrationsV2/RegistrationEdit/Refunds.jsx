import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import {
  Button, Header, Message, Table,
} from 'semantic-ui-react';
import getAvailableRefunds from '../api/payment/get/getAvailableRefunds';
import refundPayment from '../api/payment/get/refundPayment';
import Loading from '../../Requests/Loading';
import AutonumericField from '../../wca/FormBuilder/input/AutonumericField';
import useInputState from '../../../lib/hooks/useInputState';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import I18n from '../../../lib/i18n';

export default function Refunds({
  onSuccess, registrationId, competitionId,
}) {
  const {
    data: refunds,
    isLoading: refundsLoading,
    refetch,
  } = useQuery({
    queryKey: ['refunds', registrationId],
    queryFn: () => getAvailableRefunds(registrationId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
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

  if (refundsLoading) {
    return <Loading />;
  }

  if (refunds.length === 0) {
    return <Message warning>{I18n.t('payments.messages.charges_refunded')}</Message>;
  }

  return (
    <>
      <Header>{I18n.t('payments.labels.available_refunds')}</Header>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{I18n.t('payments.labels.original_payment')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('registrations.refund_form.hints.refund_amount')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('registrations.refund_form.labels.refund_amount')}</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {refunds.map((refund) => (
            <RefundRow
              refund={refund}
              refundMutation={refundMutation}
              isMutating={isMutating}
              competitionId={competitionId}
              key={refund.payment_id}
            />
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

function RefundRow({
  refund, refundMutation, isMutating, competitionId,
}) {
  const [amountToRefund, setAmountToRefund] = useInputState(refund.ruby_amount_refundable);

  // React state persists across rerenders, so `amountToRefund` would keep old values
  // which is problematic when refunding more than 50% of the original
  // (because then the input exceeds the new max, leading to a whole new tragedy with AN)
  useEffect(() => {
    setAmountToRefund((prevAmount) => Math.min(prevAmount, refund.ruby_amount_refundable));
  }, [refund.ruby_amount_refundable, setAmountToRefund]);

  const confirm = useConfirm();

  const attemptRefund = () => confirm({
    content: I18n.t('registrations.refund_confirmation'),
  }).then(() => {
    refundMutation({
      competitionId,
      paymentId: refund.payment_id,
      paymentProvider: refund.payment_provider,
      amount: amountToRefund,
    });
  });

  return (
    <Table.Row>
      <Table.Cell>
        {refund.human_amount_payment}
      </Table.Cell>
      <Table.Cell>
        {refund.human_amount_refundable}
      </Table.Cell>
      <Table.Cell>
        <AutonumericField
          currency={refund.currency_code.toUpperCase()}
          value={amountToRefund}
          onChange={setAmountToRefund}
          max={refund.ruby_amount_refundable}
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
  );
}
