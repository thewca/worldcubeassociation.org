import React from 'react';
import { Table } from 'semantic-ui-react';
import EmailButton from '../EmailButton';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import I18n from '../../lib/i18n';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import UserBadge from '../UserBadge';

export default function GroupPage({ group }) {
  const {
    data: groupMembers,
    loading: groupMembersLoading,
    error: groupMembersError,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroup(group.id, 'status,name', { isActive: true }));

  if (groupMembersLoading) return <Loading />;
  if (groupMembersError) return <Errored />;

  return (
    <>
      <p>{I18n.t(`page.teams_committees_councils.groups_description.${group.metadata.friendly_id}`)}</p>
      <EmailButton email={group.metadata.email} />
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
          {groupMembers.map((groupMember) => (
            <Table.Row key={groupMember.user.id}>
              <Table.Cell>
                <UserBadge
                  user={groupMember.user}
                  hideBorder
                  leftAlign
                />
              </Table.Cell>
              <Table.Cell>
                {I18n.t(`enums.user_roles.status.${groupMember.group.group_type}.${groupMember.metadata.status}`)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}
