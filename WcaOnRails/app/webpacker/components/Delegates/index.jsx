/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react';

import { Button, Table } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import UserBadge from '../UserBadge';

import '../../stylesheets/delegates/style.scss';

const dasherize = (string) => string.replace(/_/g, '-');

export default function Delegates({
  delegates,
  isEditVisible,
}) {
  const seniorDelegates = React.useMemo(() => delegates
    .filter((user) => user.delegate_status === 'senior_delegate')
    .sort((user1, user2) => user1.region.localeCompare(user2.region)), [delegates]);

  // TO_VERIFY: I assume there are no cases where there are no delegates without
  // senior delegate unless they are senior delegate

  return seniorDelegates.map((seniorDelegate) => {
    const delegatesUnderSenior = [seniorDelegate, ...delegates
      .filter((user) => user.senior_delegate_id === seniorDelegate.id && user.delegate_status !== 'trainee_delegate')
      .sort((user1, user2) => {
        if (user1.region < user2.region) {
          return -1;
        } if (user1.region > user2.region) {
          return 1;
        } if (user1.name < user2.name) {
          return -1;
        } if (user1.name > user2.name) {
          return 1;
        }
        return 0;
      })];
    return (
      <div
        className="table-responsive"
        key={`region-${seniorDelegate.id}`}
      >

        <Table className='delegates-table'>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={5}>{I18n.t('delegates_page.table.name')}</Table.HeaderCell>
              <Table.HeaderCell width={2}>{I18n.t('delegates_page.table.role')}</Table.HeaderCell>
              <Table.HeaderCell width={2}>{I18n.t('delegates_page.table.region')}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {delegatesUnderSenior.map((delegate) => (
              <Table.Row className={`${dasherize(delegate.delegate_status)}`}
                  key={delegate.id}>
                <Table.Cell>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <Button
                      href={`mailto:${delegate.email}`}
                      className="ui icon button"
                    >
                      <i className="envelope icon" />
                    </Button>
                    {isEditVisible && (
                    <Button
                      href={`users/${delegate.id}/edit`}
                      className="ui icon button"
                    >
                      <i className="edit icon" />
                    </Button>
                    )}
                    <UserBadge
                      user={delegate}
                      hideBorder
                      leftAlign
                      subtexts={delegate.wca_id ? [delegate.wca_id] : []}
                    />
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {I18n.t(`enums.user.delegate_status.${delegate.delegate_status}`)}
                </Table.Cell>
                <Table.Cell>
                  {delegate.region}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    );
  });
}
