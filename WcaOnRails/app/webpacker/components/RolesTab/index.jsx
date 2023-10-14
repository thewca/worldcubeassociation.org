import React from 'react';
import {
  Modal,
  Button,
  Header,
  List,
} from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  roleListUrl,
} from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import RoleForm from './RoleForm';

const delegateRoleId = 'delegate'; // This is a temporary roleID for delegate edit page, which will be changed to proper ID after implementation of roles table.

function RoleFormModal({
  trigger, userId, roleId, sync,
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Modal
      size="fullscreen"
      onClose={() => {
        setOpen(false);
        sync();
      }}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={trigger}
    >
      <Modal.Content>
        <RoleForm
          userId={userId}
          roleId={roleId}
        />
      </Modal.Content>
    </Modal>
  );
}

export default function RolesTab({ userId }) {
  const {
    data, sync, loading, error,
  } = useLoadedData(roleListUrl(userId));

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (data.activeRoles.length > 0
    ? (
      <>
        <Header>Active Roles</Header>
        <List>
          <List.Item>
            <RoleFormModal
              trigger={(
                <Button.Group basic vertical>
                  <Button>Delegate</Button>
                </Button.Group>
          )}
              userId={userId}
              roleId={delegateRoleId}
              sync={sync}
            />

          </List.Item>
        </List>
      </>
    ) : (
      <>
        <p>No Active Roles...</p>
        <RoleFormModal
          trigger={<Button>New Role</Button>}
          userId={userId}
          sync={sync}
        />
      </>
    )
  );
}
