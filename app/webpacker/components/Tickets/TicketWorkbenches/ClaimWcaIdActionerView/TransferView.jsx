import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Modal, Header,
} from 'semantic-ui-react';
import transferClaimWcaId from '../../api/claimWcaId/transferClaimWcaId';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import useInputState from '../../../../lib/hooks/useInputState';

export default function TransferView({ ticketId, currentStakeholder }) {
  const queryClient = useQueryClient();
  const [showTransferModal, setShowTransferModal] = useState();
  const [selectedDelegate, setSelectedDelegate] = useInputState();

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setSelectedDelegate(null);
  };

  const {
    mutate: transferClaimWcaIdMutate,
    isPending: isTransferring,
    isError: isTransferError,
    error: transferError,
  } = useMutation({
    mutationFn: transferClaimWcaId,
    onSuccess: () => {
      closeTransferModal();
      queryClient.invalidateQueries(['ticket-details', ticketId]);
    },
  });

  if (isTransferring) return <Loading />;
  if (isTransferError) return <Errored error={transferError} />;

  return (
    <>
      <Button
        onClick={() => setShowTransferModal(true)}
      >
        Transfer to another delegate
      </Button>

      <Modal
        open={showTransferModal}
        onClose={closeTransferModal}
        size="small"
      >
        <Header>Transfer to another delegate</Header>
        <Modal.Content>
          <p>Select a delegate to transfer this WCA ID claim ticket to:</p>
          <IdWcaSearch
            name="delegate"
            value={selectedDelegate}
            onChange={setSelectedDelegate}
            multiple={false}
            model={SEARCH_MODELS.user}
            params={{ only_staff_delegates: true }}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={closeTransferModal}>
            Cancel
          </Button>
          <Button
            positive
            disabled={!selectedDelegate}
            onClick={() => {
              transferClaimWcaIdMutate({
                ticketId,
                actingStakeholderId: currentStakeholder.id,
                newDelegateId: selectedDelegate?.item?.id || selectedDelegate,
              });
            }}
          >
            Transfer
          </Button>
        </Modal.Actions>
      </Modal>
    </>
  );
}
