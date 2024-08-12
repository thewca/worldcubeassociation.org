import React from 'react';
import { Icon, Table, Segment } from 'semantic-ui-react';
import UserBadge from '../../../UserBadge';

export default function BannedCompetitors({
  bannedCompetitorRoles,
  canEditBannedCompetitors,
  editBannedCompetitor,
}) {
  return (
    <>
      {bannedCompetitorRoles.length > 0 ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={5}>User</Table.HeaderCell>
              <Table.HeaderCell width={2}>Start date</Table.HeaderCell>
              <Table.HeaderCell width={2}>End date</Table.HeaderCell>
              <Table.HeaderCell width={4}>Reason</Table.HeaderCell>
              <Table.HeaderCell width={3}>Scope</Table.HeaderCell>
              {canEditBannedCompetitors && (
                <Table.HeaderCell width={2}>Edit</Table.HeaderCell>
              )}
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
                    subtexts={role.user.wca_id ? [role.user.wca_id] : []}
                  />
                </Table.Cell>
                <Table.Cell>{role.start_date}</Table.Cell>
                <Table.Cell>{role.end_date}</Table.Cell>
                <Table.Cell>{role.metadata.ban_reason}</Table.Cell>
                <Table.Cell>{role.metadata.scope}</Table.Cell>
                {canEditBannedCompetitors && (
                  <Table.Cell>
                    <Icon
                      name="edit"
                      link
                      onClick={() => editBannedCompetitor({ action: "edit", role })}
                    />
                  </Table.Cell>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : (
        <Segment placeholder textAlign="center">
          <p>No Data to Show.</p>
        </Segment>
      )}
    </>
  );
}
