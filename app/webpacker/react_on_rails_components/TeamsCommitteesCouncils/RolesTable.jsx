import React from 'react';
import { Table } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import UserBadge from '../UserBadge';

export default function RolesTable({ roleList }) {
  return (
    <Table unstackable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>
            {I18n.t('delegates_page.table.name')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('delegates_page.table.role')}
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {roleList.map((role) => (
          <Table.Row key={role.user.id}>
            <Table.Cell>
              <UserBadge
                user={role.user}
                hideBorder
                leftAlign
                subtexts={[role.end_date ? `${role.start_date} - ${role.end_date}` : '']}
              />
            </Table.Cell>
            <Table.Cell>
              {I18n.t(`enums.user_roles.status.${role.group.group_type}.${role.metadata.status}`)}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
