import React, { useCallback, useState } from 'react';
import {
  Button,
  CardGroup,
  Header,
  List,
  Segment,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import I18n from '../../../../lib/i18n';
import AvatarCard from './AvatarCard';
import updateAvatars from './api/updateAvatars';
import WCAQueryClientProvider from '../../../../lib/providers/WCAQueryClientProvider';

const transformAvatarsForRequest = (approvedAvatars, rejectedAvatars) => {
  const avatars = {};

  approvedAvatars.forEach(({ id }) => {
    avatars[id] = { action: 'approve' };
  });

  rejectedAvatars.forEach(({ id, rejectionReason }) => {
    avatars[id] = { action: 'reject', rejection_reason: rejectionReason };
  });

  return { avatars };
};

export default function Wrapper({ pendingUsers }) {
  return (
    <WCAQueryClientProvider>
      <ApprovePictures pendingUsers={pendingUsers} />
    </WCAQueryClientProvider>
  );
}

function ApprovePictures({ pendingUsers }) {
  const [approvedAvatars, setApprovedAvatarIds] = useState([]);
  const [rejectedAvatars, setRejectedAvatarIds] = useState([]);
  const [deferredAvatars, setDeferredAvatarIds] = useState([]);

  const onApprove = useCallback((avatar) => {
    setApprovedAvatarIds((prev) => (prev.includes(avatar.id) ? prev.filter((a) => a.id !== avatar.id)
      : [...prev, avatar]));
  }, [setApprovedAvatarIds]);

  const onReject = useCallback((avatar, rejectionReason) => {
    setRejectedAvatarIds((prev) => (prev.includes(avatar.id) ? prev.filter((a) => a.id !== avatar.id)
      : [...prev, { ...avatar, rejectionReason }]));
  }, [setRejectedAvatarIds]);

  const onDefer = useCallback((avatar) => {
    setDeferredAvatarIds((prev) => (prev.includes(avatar.id) ? prev.filter((a) => a.id !== avatar.id)
      : [...prev, avatar]));
  }, [setDeferredAvatarIds]);

  const { mutate: decideOnAvatars } = useMutation({
    mutationFn: () => updateAvatars(transformAvatarsForRequest(approvedAvatars, rejectedAvatars)),
    onSuccess: (data) => {
      setApprovedAvatarIds([]);
      setRejectedAvatarIds([]);
    },
  });

  return (
    <>
      <Segment>
        <Header as="h3">Guidelines</Header>
        <List bulleted>
          {I18n.tArray('users.edit.avatar_guidelines').map((g, idx) => <List.Item key={g}>{g}</List.Item>)}
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
              user={user}
              onApprove={onApprove}
              onReject={onReject}
              onDefer={onDefer}
            />
          ))}
          <Button primary onClick={decideOnAvatars}> Submit </Button>
        </CardGroup>
      ) : (
        <p>
          No new pictures have been submitted
        </p>
      )}
    </>
  );
}
