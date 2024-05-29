import React, { useState } from 'react';
import {
  Button, Header, Icon, Modal, Table,
} from 'semantic-ui-react';
import UserBadge from '../../../UserBadge';
import BanendCompetitorForm from './BannedCompetitorForm';

export default function BannedCompetitors({ bannedCompetitorRoles, sync }) {
  const [banModalParams, setBanModalParams] = useState(null);

  return (
    <>
      <Header>Banned Competitors</Header>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={5}>User</Table.HeaderCell>
            <Table.HeaderCell width={2}>Start date</Table.HeaderCell>
            <Table.HeaderCell width={2}>End date</Table.HeaderCell>
            <Table.HeaderCell width={2}>Edit</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {bannedCompetitorRoles.map((role) => (
            <Table.Row key={role.id}>
              <Table.Cell>
                <UserBadge
                  user={role.user}
                  hideBorder
                  leftAlign
                />
              </Table.Cell>
              <Table.Cell>{role.start_date}</Table.Cell>
              <Table.Cell>{role.end_date}</Table.Cell>
              <Table.Cell>
                <Icon
                  name="edit"
                  link
                  onClick={() => setBanModalParams({ action: 'edit', role })}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Button onClick={() => setBanModalParams({ action: 'new' })}>Ban new competitor</Button>
      <Modal
        open={!!banModalParams}
        onClose={() => setBanModalParams(null)}
      >
        <Modal.Header>Add/Edit Banned Competitor</Modal.Header>
        <Modal.Content>
          <BanendCompetitorForm
            sync={sync}
            banAction={banModalParams?.action}
            banActionRole={banModalParams?.role}
            closeForm={() => setBanModalParams(null)}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
