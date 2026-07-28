import React, { useState } from 'react';
import {
  Button, Dropdown, Form, Header, Modal, Table,
} from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import { useConfirm } from '../../../../lib/providers/ConfirmProvider';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import WcaSearch from '../../../SearchWidget/WcaSearch';
import useInputState from '../../../../lib/hooks/useInputState';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import { statusObjectOfGroupType } from '../../../../lib/helpers/status-objects';

const isLead = (role) => role.metadata.status === 'leader';

const canPromote = (role) => (
  role.metadata.status === statusObjectOfGroupType(role.group.group_type).member
);

const canDemote = (role) => (
  role.metadata.status === statusObjectOfGroupType(role.group.group_type).senior_member
);

function GroupTable({ group }) {
  const {
    data: roles, loading, error, sync,
  } = useLoadedData(apiV0Urls.userRoles.list(
    { isActive: true, groupId: group.id },
    'status:desc,startDate,name', // Sort params
  ));
  const confirm = useConfirm();
  const { save, saving } = useSaveAction();
  const [modalOpen, setModelOpen] = useState(false);
  const [newMemberUser, setNewMemberUser] = useInputState(null);

  const promoteRoleHandler = (role) => {
    confirm({
      content: `Are you sure that you want to promote ${role.user.name} from ${I18n.t(`enums.user_roles.status.${role.group.group_type}.${role.metadata.status}`)} to ${I18n.t(`enums.user_roles.status.${role.group.group_type}.${statusObjectOfGroupType(role.group.group_type).senior_member}`)}?`,
    }).then(() => {
      save(apiV0Urls.userRoles.update(role.id), {
        status: statusObjectOfGroupType(role.group.group_type).senior_member,
      }, sync, { method: 'PATCH' });
    });
  };

  const demoteRoleHandler = (role) => {
    confirm({
      content: `Are you sure that you want to demote ${role.user.name} from ${I18n.t(`enums.user_roles.status.${role.group.group_type}.${role.metadata.status}`)} to ${I18n.t(`enums.user_roles.status.${role.group.group_type}.${statusObjectOfGroupType(role.group.group_type).member}`)}?`,
    }).then(() => {
      save(apiV0Urls.userRoles.update(role.id), {
        status: statusObjectOfGroupType(role.group.group_type).member,
      }, sync, { method: 'PATCH' });
    });
  };

  const endRoleHandler = (role) => {
    confirm({
      content: `Are you sure that you want to end the role for ${role.user.name} (${I18n.t(`enums.user_roles.status.${role.group.group_type}.${role.metadata.status}`)})?`,
    }).then(() => {
      save(apiV0Urls.userRoles.delete(role.id), null, sync, { method: 'DELETE' });
    });
  };

  if (loading || saving) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      <Header as="h2">Active members</Header>
      <Button onClick={() => setModelOpen(true)}>Add new member</Button>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Start Date</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {roles.map((role) => (
            <Table.Row key={role.id}>
              <Table.Cell>{role.user.name}</Table.Cell>
              <Table.Cell>{role.start_date}</Table.Cell>
              <Table.Cell>
                {`${I18n.t(`enums.user_roles.status.${role.group.group_type}.${role.metadata.status}`)}`}
              </Table.Cell>
              <Table.Cell>
                {canPromote(role)
                  && <Button onClick={() => promoteRoleHandler(role)}>Promote</Button>}
                {canDemote(role)
                  && <Button onClick={() => demoteRoleHandler(role)}>Demote</Button>}
                {!isLead(role)
                  && <Button onClick={() => endRoleHandler(role)}>End Role</Button>}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Modal
        size="fullscreen"
        onClose={() => {
          setModelOpen(false);
        }}
        open={modalOpen}
      >
        <Modal.Content>
          <Form>
            <Form.Field
              label="New Member"
              control={WcaSearch}
              value={newMemberUser}
              onChange={setNewMemberUser}
              model={SEARCH_MODELS.user}
              multiple={false}
            />
            <Form.Button onClick={() => setModelOpen(false)}>Cancel</Form.Button>
            <Form.Button
              disabled={!newMemberUser}
              onClick={() => {
                setModelOpen(false);
                save(apiV0Urls.userRoles.create(), {
                  userId: newMemberUser.id,
                  groupId: group.id,
                  status: statusObjectOfGroupType(group.group_type).member,
                }, sync, { method: 'POST' });
              }}
            >
              Save
            </Form.Button>
          </Form>
        </Modal.Content>
      </Modal>
    </>
  );
}

export function GroupsManagerForGroups({ groups }) {
  const [selectedGroupIndex, setSelectedGroupIndex] = useInputState(0);

  return (
    <>
      <div>
        <Dropdown
          options={groups.map((group, index) => ({
            key: group.id,
            text: group.name,
            value: index,
          }))}
          value={selectedGroupIndex}
          onChange={setSelectedGroupIndex}
        />
      </div>
      <GroupTable group={groups[selectedGroupIndex]} />
    </>
  );
}

export default function GroupsManager({ loggedInUserId }) {
  const { data: roles, loading, error } = useLoadedData(apiV0Urls.userRoles.list(
    { isActive: true, status: 'leader', userId: loggedInUserId },
    'groupName', // Sort params
  ));

  if (loading) return <Loading />;
  if (error) return <Errored />;
  if (roles.length === 0) return <p>You are not a leader of any groups.</p>;
  return <GroupsManagerForGroups groups={roles.map((role) => role.group)} />;
}
