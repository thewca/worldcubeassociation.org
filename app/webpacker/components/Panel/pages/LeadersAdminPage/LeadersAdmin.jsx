import React, { useState } from 'react';

import {
  Icon,
  Modal,
  Table,
} from 'semantic-ui-react';

import LeaderChangeForm from './LeaderChangeForm';

export default function LeadersAdmin({ groups, sync }) {
  const [editGroup, setEditGroup] = useState();

  return (
    <>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell />
            <Table.HeaderCell>Group</Table.HeaderCell>
            <Table.HeaderCell>Leader</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {groups.map((group) => (
            <Table.Row key={group.id}>
              <Table.Cell>
                <Icon
                  link
                  name="edit"
                  onClick={() => setEditGroup(group)}
                />
              </Table.Cell>
              <Table.Cell>{group.name}</Table.Cell>
              <Table.Cell>{group.lead_user?.name}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Modal
        open={!!editGroup}
        onClose={() => setEditGroup(null)}
      >
        <Modal.Header>{`Edit ${editGroup?.name} Leader`}</Modal.Header>
        <Modal.Content>
          <LeaderChangeForm
            syncData={() => sync(editGroup)}
            group={editGroup}
            oldLeader={editGroup?.lead_user}
            closeForm={() => setEditGroup(null)}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
