import React from 'react';
import { Button, List } from 'semantic-ui-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import UserItem from '../../SearchWidget/UserItem';
import I18n from '../../../lib/i18n';
import unlinkWcaId from '../api/unlinkWcaId';
import getPersonDetails from '../api/getPersonDetails';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import HandleClaimModal from './HandleClaimModal';

import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';

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
    queryClient.setQueryData(['user-details-for-edit', userId], (old) => ({
      ...old,
      wca_id: null,
    }));
    // Invalidate the person query for cache consistency across the site.
    // This component will unmount once the user details are updated.
    queryClient.invalidateQueries({ queryKey: ['person', personId] });
  };

  const {
    mutate: unlinkWcaIdMutation,
    isPending: isUnlinkingPending,
    isError: isUnlinkingError,
    error: unlinkingError,
  } = useMutation({
    mutationFn: unlinkWcaId,
    onSuccess,
  });

  if (isFetching) return <Loading />;
  if (isError) return <Errored error={error} />;

  const handleUnlinkClick = () => {
    confirm({
      content: I18n.t('users.edit.unlink_confirm', { wca_id: personId }),
    }).then(() => unlinkWcaIdMutation({ userId })).catch(() => {});
  };

  return (
    <List.Item>
      <List.Content floated="right" verticalAlign="middle">
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
          <HandleClaimModal
            userId={userId}
            person={person}
            disabled={isUnlinkingPending}
          />
        )}
      </List.Content>

      <List.Content>
        <UserItem item={person} />
        {isUnlinkingError && <Errored error={unlinkingError} />}
      </List.Content>
    </List.Item>
  );
}
