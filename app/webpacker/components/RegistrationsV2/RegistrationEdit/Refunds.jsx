import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  Button, Header, Message, Table,
} from 'semantic-ui-react';
import getAvailableRefunds from '../api/payment/get/getAvailableRefunds';
import refundPayment from '../api/payment/get/refundPayment';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';
import Loading from '../../Requests/Loading';
import AutonumericField from '../../wca/FormBuilder/input/AutonumericField';

export default function Refunds({
  onSuccess, userId, competitionId,
}) {
  const dispatch = useDispatch();

  const {
    data: refunds,
    isLoading: refundsLoading,
    refetch,
  } = useQuery({
    queryKey: ['refunds', competitionId, userId],
    queryFn: () => getAvailableRefunds(competitionId, userId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
    select: (data) => data.charges.filter((r) => r.ruby_amount !== 0),
  });
  const { mutate: refundMutation, isPending: isMutating } = useMutation({
    mutationFn: refundPayment,
    onError: (data) => {
      dispatch(setMessage(
        `Refund payment failed with error: ${data.errorCode}`,
        'negative',
      ));
    },
    onSuccess: () => {
      dispatch(setMessage('Refund succeeded', 'positive'));
      refetch();
      onSuccess();
    },
  });

  if (refundsLoading) {
    return <Loading />;
  }

  if (refunds.length === 0) {
    return <Message success>All charges have been refunded</Message>;
  }

  return (
    <>
      <Header>Available Refunds:</Header>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Original Payment</Table.HeaderCell>
            <Table.HeaderCell>Available to Refund</Table.HeaderCell>
            <Table.HeaderCell>Refund Amount </Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {refunds.map((refund) => (
            <RefundRow
              refund={refund}
              refundMutation={refundMutation}
              isMutating={isMutating}
              userId={userId}
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
  refund, refundMutation, isMutating, userId, competitionId,
}) {
  const [amountToRefund, setAmountToRefund] = useState(refund.ruby_amount_refundable);

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
          onChange={(event, { value }) => setAmountToRefund(value)}
          max={refund.ruby_amount_refundable}
        />
      </Table.Cell>
      <Table.Cell>
        <Button
          onClick={() => refundMutation({
            competitionId,
            userId,
            paymentId: refund.payment_id,
            amount: amountToRefund,
          })}
          disabled={isMutating}
        >
          Refund Amount
        </Button>
      </Table.Cell>
    </Table.Row>
  );
}
