import React, { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Header,
  Segment,
  Image,
  Divider,
  Grid,
  Card,
  Checkbox,
  Input,
} from 'semantic-ui-react';
import { editPersonUrl } from '../../../../lib/requests/routes.js.erb';
import I18n from '../../../../lib/i18n';
import useInputState from '../../../../lib/hooks/useInputState';

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
        }}
      />
      <Divider horizontal />
      <Button.Group toggle>
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
      </Button.Group>
    </Segment>
  );
}

export default function AvatarCard({
  user, onReject, onApprove,
}) {
  const [activeAvatarIndex, setActiveAvatarIndex] = useState(0);
  const [rejectionGuidelines, setRejectionGuidelines] = useState([]);
  const [rejectionReason, setRejectionReason] = useInputState('');
  const [isChoosingRejectionReason, setIsChoosingRejectionReason] = useState(false);

  const possibleRejectionReasons = useMemo(() => {
    const standardReasons = I18n.tArray('users.edit.avatar_guidelines');

    if (user['staff_or_any_delegate?']) {
      const staffReasons = I18n.tArray('users.edit.staff_avatar_guidelines.paragraphs');
      return [...standardReasons, ...staffReasons];
    }

    return standardReasons;
  }, [user]);

  const handleRejectionGuidelineClick = useCallback((e, { checked, label: guideline }) => {
    setRejectionGuidelines(
      (prev) => (checked ? [...prev, guideline] : prev.filter((reason) => reason !== guideline)),
    );
  }, [setRejectionGuidelines]);

  const currentAvatarActions = useMemo(() => [
    {
      label: 'Previous',
      onClick: () => setActiveAvatarIndex((idx) => idx - 1),
      color: 'blue',
      basic: true,
      disabled: activeAvatarIndex === 0,
    },
    {
      label: 'Next',
      onClick: () => setActiveAvatarIndex((idx) => idx + 1),
      color: 'blue',
      basic: true,
      disabled: activeAvatarIndex === user.avatar_history.length - 1,
    },
  ], [activeAvatarIndex, user.avatar_history.length]);

  const handleRejectionButtonClick = useCallback(() => {
    if (isChoosingRejectionReason) {
      if (rejectionGuidelines.length === 0) {
        setIsChoosingRejectionReason(false);
      } else {
        onReject(user.pending_avatar, rejectionGuidelines, rejectionReason);
      }
    } else {
      setIsChoosingRejectionReason(true);
    }
  }, [
    isChoosingRejectionReason,
    onReject,
    rejectionGuidelines,
    rejectionReason,
    user.pending_avatar,
  ]);

  const pendingAvatarActions = [
    {
      label: 'Approve',
      onClick: () => onApprove(user.pending_avatar),
      color: 'green',
    },
    {
      label: 'Reject',
      onClick: () => handleRejectionButtonClick(),
      color: 'red',
    },
  ];

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <a href={editPersonUrl(user.id)}>
            {user.name}
          </a>
        </Card.Header>
        { user['staff_or_any_delegate?'] && (
          <Card.Meta>
            <strong>Staff Member or Trainee Delegate</strong>
            {' '}
            - see guidelines above
          </Card.Meta>
        )}
        <Card.Description>
          <Grid columns={2} stackable padded>
            <Grid.Row>
              <Grid.Column>
                <Avatar
                  title="Pending Avatar"
                  imageUrl={user.pending_avatar.url}
                  actions={pendingAvatarActions}
                />
                {isChoosingRejectionReason && (
                  <>
                    {possibleRejectionReasons.map((r) => (
                      <Checkbox
                        checked={rejectionGuidelines.includes(r)}
                        onClick={handleRejectionGuidelineClick}
                        label={r}
                      />
                    ))}
                    <Input fluid placeholder="Additional Rejection Reason" value={rejectionReason} onChange={setRejectionReason} />
                  </>
                )}
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
        </Card.Description>
      </Card.Content>
    </Card>
  );
}
