import React, { useCallback } from 'react';
import {
  CardGroup,
  Header,
  List,
  Segment,
} from 'semantic-ui-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import I18n from '../../../../lib/i18n';
import AvatarCard from './AvatarCard';
import updateAvatars from './api/updateAvatars';
import WCAQueryClientProvider from '../../../../lib/providers/WCAQueryClientProvider';
import getPendingAvatarUsers from './api/getPendingAvatarUsers';
import Loading from '../../../Requests/Loading';

export default function Wrapper() {
  return (
    <WCAQueryClientProvider>
      <ApprovePictures />
    </WCAQueryClientProvider>
  );
}

function ApprovePictures() {
  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pending-avatars'],
    queryFn: getPendingAvatarUsers,
  });

  const queryClient = useQueryClient();

  const { mutate: decideOnAvatars } = useMutation({
    mutationFn: updateAvatars,
    onSuccess: (_, params) => {
      queryClient.setQueryData(
        ['pending-avatars'],
        (oldData) => oldData.filter((p) => p.pending_avatar.id !== params.avatarId),
      );
    },
  });

  const onApprove = useCallback((avatar) => {
    decideOnAvatars({ avatarId: avatar.id, action: 'approve' });
  }, [decideOnAvatars]);

  const onReject = useCallback((avatar, rejectionGuidelines, rejectionReason) => {
    decideOnAvatars({
      avatarId: avatar.id, action: 'reject', rejectionGuidelines, rejectionReason,
    });
  }, [decideOnAvatars]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Segment>
        <Header as="h3">Guidelines</Header>
        <List bulleted>
          {I18n.tArray('users.edit.avatar_guidelines').map((g) => <List.Item key={g}>{g}</List.Item>)}
        </List>
        <Header as="h4">Additional guidelines for Staff Members</Header>
        <List bulleted>
          {I18n.tArray('users.edit.staff_avatar_guidelines.paragraphs').map((g) => <List.Item key={g}>{g}</List.Item>)}
        </List>
      </Segment>
      {pendingUsers.length > 0 ? (
        <CardGroup>
          {pendingUsers.map((user) => (
            <AvatarCard
              key={user.id}
              user={user}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </CardGroup>
      ) : (
        <p>
          No new pictures have been submitted
        </p>
      )}
    </>
  );
}
