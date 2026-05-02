import React from 'react';
import { Button, List } from 'semantic-ui-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import UserItem from '../../SearchWidget/UserItem';
import I18n from '../../../lib/i18n';
import unlinkWcaId from '../api/unlinkWcaId';
import confirmWcaId from '../api/confirmWcaId';
import clearClaimWcaId from '../api/clearClaimWcaId';
import getPersonDetails from '../api/getPersonDetails';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';

import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';

// TODO: Improve this class, rest of the PR is good.
export default function WcaIdPersonView({
  userId, personId, isConfirmed, specialAccount,
}) {
  const queryClient = useQueryClient();
  const {
    data: person,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => getPersonDetails(personId),
  });
  const confirm = useConfirm();
  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['user-details-for-edit', userId] });
    queryClient.invalidateQueries({ queryKey: ['person', personId] });
  };

  const { mutate: unlinkWcaIdMutation, isPending: isUnlinkingPending } = useMutation({
    mutationFn: () => unlinkWcaId(userId),
    onSuccess,
  });

  const { mutate: confirmWcaIdMutation, isPending: isConfirmingPending } = useMutation({
    mutationFn: () => confirmWcaId(userId, personId),
    onSuccess,
  });

  const { mutate: clearClaimWcaIdMutation, isPending: isClearingPending } = useMutation({
    mutationFn: () => clearClaimWcaId(userId),
    onSuccess,
  });

  if (isFetching) return <Loading />;
  if (isError) return <Errored error={error} />;

  const isPending = isConfirmingPending || isClearingPending || isUnlinkingPending;

  const handleUnlinkClick = () => {
    confirm({
      content: I18n.t('users.edit.unlink_confirm', { wca_id: personId }),
    }).then(() => unlinkWcaIdMutation()).catch(() => {});
  };

  const handleConfirmClick = () => {
    confirm({
      content: I18n.t('users.edit.approve_confirm', { wca_id: personId }),
    }).then(() => confirmWcaIdMutation()).catch(() => {});
  };

  const handleClearClaimClick = () => {
    confirm({
      content: I18n.t('users.edit.clear_claim_confirm', { wca_id: personId }),
    }).then(() => clearClaimWcaIdMutation()).catch(() => {});
  };

  return (
    <List.Item>
      <List.Content floated="right">
        {isConfirmed ? (
          <Button
            type="button"
            size="small"
            color="red"
            disabled={specialAccount || isUnlinkingPending}
            onClick={handleUnlinkClick}
            loading={isUnlinkingPending}
          >
            {I18n.t('users.edit.unlink_wca_id')}
          </Button>
        ) : (
          <>
            <Button
              size="small"
              color="green"
              onClick={handleConfirmClick}
              loading={isConfirmingPending}
              disabled={isPending}
            >
              {I18n.t('users.edit.approve')}
            </Button>
            <Button
              size="small"
              color="red"
              onClick={handleClearClaimClick}
              loading={isClearingPending}
              disabled={isPending}
            >
              {I18n.t('users.edit.clear_claim')}
            </Button>
          </>
        )}
      </List.Content>

      <List.Content>
        <UserItem item={person} />
      </List.Content>
    </List.Item>
  );
}
