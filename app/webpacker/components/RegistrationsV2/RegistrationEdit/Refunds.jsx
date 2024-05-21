import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  Button, Modal, Table,
} from 'semantic-ui-react';
import getAvailableRefunds from '../api/payment/get/getAvailableRefunds';
import refundPayment from '../api/payment/get/refundPayment';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';
import Loading from '../../Requests/Loading';

export default function Refunds({
  open, onExit, userId, competitionId,
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
      <Modal open={open} dimmer="blurring">
        <Modal.Header>Available Refunds:</Modal.Header>
        <Modal.Content>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell> </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {refunds.charges.map((refund) => (
                <Table.Row key={refund.payment_id}>
                  <Table.Cell>
                    {refund.human_amount}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      onClick={() => refundMutation({
                        competitionId,
                        userId,
                        paymentId: refund.payment_id,
                        amount: refund.ruby_amount,
                      })}
                    >
                      Refund Amount
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Modal.Content>
        <Modal.Actions>
          <Button disabled={isMutating} onClick={onExit}>
            Go Back
          </Button>
        </Modal.Actions>
      </Modal>
    )
  );
}
