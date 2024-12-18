import React, { useMemo, useState } from 'react';
import {
  Button,
  ButtonGroup,
  Header,
  Segment,
  Image,
  Divider,
  CardContent,
  CardHeader,
  CardMeta,
  CardDescription,
  Grid,
  Card, Checkbox,
} from 'semantic-ui-react';
import { editPersonUrl } from '../../../../lib/requests/routes.js.erb';
import I18n from '../../../../lib/i18n';

function Avatar({
  title, actions, imageUrl,
}) {
  return (
    <Segment textAlign="center" padded>
      <Header as="h3" content={title} />
      <Image
        src={imageUrl}
        size="medium"
        centered
        style={{
          objectFit: 'contain',
          height: '250px',
          width: '250px',
        }}
      />
      <Divider horizontal />
      <ButtonGroup toggle>
        {actions.map((action) => (
          <Button
            key={action.label}
            onClick={action.onClick}
            color={action.color}
            basic={action.basic}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </ButtonGroup>
    </Segment>
  );
}

export default function AvatarCard({
  user, onReject, onApprove, onDefer,
}) {
  const [activeAvatarIndex, setActiveAvatarIndex] = useState(0);
  const [avatarState, setAvatarState] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const possibleRejectionReasons = useMemo(() => {
    const r = I18n.tArray('users.edit.avatar_guidelines');
    if (user['staff_or_any_delegate?']) {
      return r.concat(I18n.tArray('users.edit.staff_avatar_guidelines.paragraphs'));
    }
    return r;
  }, [user]);

  const currentAvatarActions = useMemo(() => [
    {
      label: 'Previous',
      onClick: () => setActiveAvatarIndex(activeAvatarIndex - 1),
      color: 'blue',
      basic: true,
      disabled: activeAvatarIndex === 0,
    },
    {
      label: 'Next',
      onClick: () => setActiveAvatarIndex(activeAvatarIndex + 1),
      color: 'blue',
      basic: true,
      disabled: activeAvatarIndex === user.avatar_history.length - 1,
    },
  ], [activeAvatarIndex, user.avatar_history.length]);

  const pendingAvatarActions = [
    {
      label: 'Approve',
      onClick: () => {
        onApprove(user.pending_avatar);
        setAvatarState('approved');
      },
      color: 'green',
      disabled: avatarState === 'approved',
    },
    {
      label: 'Reject',
      onClick: () => {
        if (avatarState === 'chooseRejectionReason') {
          if (rejectionReason === '') {
            setAvatarState('');
          } else {
            onReject(user.pending_avatar, rejectionReason);
            setAvatarState('rejected');
          }
        } else {
          setAvatarState('chooseRejectionReason');
        }
      },
      color: 'red',
      disabled: avatarState === 'rejected',
    },
    {
      label: 'Defer',
      onClick: () => {
        onDefer(user.pending_avatar);
        setAvatarState('deferred');
      },
      color: 'grey',
      disabled: avatarState === 'deferred',
    },
  ];

  return (
    <Card fluid>
      <CardContent>
        <CardHeader>
          <a href={editPersonUrl(user.id)}>
            {user.name}
          </a>
        </CardHeader>
        { user['staff_or_any_delegate?'] && (
          <CardMeta>
            <strong>Staff Member or Trainee Delegate</strong>
            {' '}
            - see guidelines above
          </CardMeta>
        )}
        <CardDescription>
          <Grid columns={2} stackable padded>
            <Grid.Row>
              <Grid.Column>
                <Avatar
                  title="Pending Avatar"
                  imageUrl={user.pending_avatar.url}
                  actions={pendingAvatarActions}
                />
                { avatarState === 'chooseRejectionReason'
                  && possibleRejectionReasons.map((r) => (
                    <Checkbox
                      checked={rejectionReason === r}
                      onClick={() => setRejectionReason(r)}
                      label={r}
                    />
                  ))}
              </Grid.Column>
              <Grid.Column>
                <Avatar
                  title={user.avatar_history[activeAvatarIndex].id === user.avatar.id ? `Current profile picture for ${user.name}`
                    : `Old profile picture for ${user.name}`}
                  imageUrl={user.avatar_history[activeAvatarIndex].url}
                  actions={currentAvatarActions}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </CardDescription>
      </CardContent>
    </Card>
  );
}
