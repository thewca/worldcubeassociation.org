import React, { useEffect, useState } from 'react';
import {
  Button, Dropdown, Header, Table,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../lib/requests/routes.js.erb';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import useSaveAction from '../../../lib/hooks/useSaveAction';

function GroupTable({ groupId }) {
  const {
    data: roles, loading, error, sync,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroup(
    groupId,
    'status,startDate,name', // Sort params
    { isActive: true },
  ));
  const confirm = useConfirm();
  const { save, saving } = useSaveAction();

  const isLead = (role) => role.metadata.status === 'leader';

  const endRoleHandler = (role) => {
    confirm().then(() => {
      save(apiV0Urls.userRoles.delete(role.id), null, sync, { method: 'DELETE' });
    });
  };

  if (loading || saving) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      <Header as="h2">Active members</Header>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {roles.map((role) => (
            <Table.Row key={role.id}>
              <Table.Cell>{role.user.name}</Table.Cell>
              <Table.Cell>
                {`${I18n.t(`enums.user.role_status.${role.group.group_type}.${role.metadata.status}`)}`}
              </Table.Cell>
              <Table.Cell>
                {!isLead(role)
                  && <Button onClick={() => endRoleHandler(role)}>End Role</Button>}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

export default function GroupsManager({ loggedInUserId }) {
  const { data: roles, loading, error } = useLoadedData(apiV0Urls.userRoles.listOfUser(
    loggedInUserId,
    'groupName', // Sort params
    { isActive: true, isGroupHidden: false, status: 'leader' },
  ));
  const [selectedGroupId, setSelectedGroupId] = useState();

  useEffect(() => {
    setSelectedGroupId(roles?.[0]?.group.id);
  }, [roles]);

  if (!loading && roles.length === 0) return <p>You are not a leader of any groups.</p>;
  if (loading || selectedGroupId === undefined) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      <div>
        <Dropdown
          options={roles.map((role) => ({
            key: role.id,
            text: role.group.name,
            value: role.group.id,
          }))}
          value={selectedGroupId}
          onChange={(_, { value }) => setSelectedGroupId(value)}
        />
      </div>
      <GroupTable groupId={selectedGroupId} />
    </>
  );
}
