import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  Button, Header, Modal, Table,
} from 'semantic-ui-react';
import getAvailableRefunds from '../api/payment/get/getAvailableRefunds';
import refundPayment from '../api/payment/get/refundPayment';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';
import Loading from '../../Requests/Loading';
import AutonumericField from '../../wca/FormBuilder/input/AutonumericField';

export default function Refunds({
  onExit, userId, competitionId,
}) {
  const dispatch = useDispatch();

  const {
    data: refunds,
    isLoading: refundsLoading,
    isError: refundError,
  } = useQuery({
    queryKey: ['refunds', competitionId, userId],
    queryFn: () => getAvailableRefunds(competitionId, userId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
  });
  const { mutate: refundMutation, isLoading: isMutating } = useMutation({
    mutationFn: refundPayment,
    onError: (data) => {
      dispatch(setMessage(
        `Refund payment failed with error: ${data.errorCode}`,
        'negative',
      ));
    },
    onSuccess: () => {
      dispatch(setMessage('Refund succeeded', 'positive'));
      onExit();
    },
  });
  return refundsLoading ? (
    <Loading />
  ) : (
    !refundError && (
      <>
        <Header>Available Refunds:</Header>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Full Amount</Table.HeaderCell>
              <Table.HeaderCell>Refund Amount </Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {refunds.charges.map((refund) => (
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
    )
  );
}

function RefundRow({
  refund, refundMutation, isMutating, userId, competitionId,
}) {
  const [amountToRefund, setAmountToRefund] = useState(refund.ruby_amount);

  return (
    <Table.Row key={refund.payment_id}>
      <Table.Cell>
        {refund.human_amount}
      </Table.Cell>
      <Table.Cell>
        <AutonumericField
          currency={refund.curreny_code}
          value={amountToRefund}
          onChange={(event, { value }) => setAmountToRefund(value)}
          max={refund.ruby_amount}
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
