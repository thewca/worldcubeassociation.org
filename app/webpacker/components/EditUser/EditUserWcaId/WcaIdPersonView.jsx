import React from 'react';
import { Button, Grid } from 'semantic-ui-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import UserItem from '../../SearchWidget/UserItem';
import I18n from '../../../lib/i18n';
import unlinkWcaId from '../api/unlinkWcaId';
import confirmWcaId from '../api/confirmWcaId';
import clearClaimWcaId from '../api/clearClaimWcaId';
import getPersonDetails from '../api/getPersonDetails';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';

import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';

export default function WcaIdPersonView({
  userId, personId, isConfirmed, specialAccount,
}) {
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
  const onSuccess = () => window.location.reload();

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
    <>
      <Grid.Column width={10}>
        <UserItem item={person} />
      </Grid.Column>

      <Grid.Column width={6} textAlign="right">
        {isConfirmed ? (
          <Button
            type="button"
            size="small"
            color="red"
            id="unlink-wca-id"
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
              id="approve-wca-id"
              onClick={handleConfirmClick}
              loading={isConfirmingPending}
              disabled={isPending}
            >
              {I18n.t('users.edit.approve')}
            </Button>
            <Button
              size="small"
              color="red"
              id="clear-claim-wca-id"
              onClick={handleClearClaimClick}
              loading={isClearingPending}
              disabled={isPending}
            >
              {I18n.t('users.edit.clear_claim')}
            </Button>
          </>
        )}
      </Grid.Column>
    </>
  );
}
