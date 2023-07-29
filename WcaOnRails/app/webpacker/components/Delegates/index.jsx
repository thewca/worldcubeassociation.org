/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react';

import { Button, Table } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import UserBadge from '../UserBadge';

import '../../stylesheets/delegates/style.scss';

const dasherize = (string) => string.replace(/_/g, '-');

export default function Delegates({
  delegates,
  regionList,
  isEditVisible,
}) {
  const sortedRegionList = React.useMemo(() => regionList
    .sort((region1, region2) => region1.name.localeCompare(region2.name)), [regionList]);

  return sortedRegionList.map((region) => {
    const delegatesUnderRegion = delegates
      .filter((user) => user.region_id === region.id && user.delegate_status !== 'trainee_delegate')
      .sort((user1, user2) => {
        if (user1.delegate_status === 'senior_delegate') {
          return -1;
        } if (user2.delegate_status === 'senior_delegate') {
          return 1;
        }
        return ((user1.region !== user2.region)
          ? user1.region.localeCompare(user2.region)
          : user1.name.localeCompare(user2.name));
      });
    return (
      <div
        className="table-responsive"
        key={`region-${region.id}`}
      >

        <Table className="delegates-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={5}>{I18n.t('delegates_page.table.name')}</Table.HeaderCell>
              <Table.HeaderCell width={2}>{I18n.t('delegates_page.table.role')}</Table.HeaderCell>
              <Table.HeaderCell width={2}>{I18n.t('delegates_page.table.region')}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {delegatesUnderRegion.map((delegate) => (
              <Table.Row
                className={`${dasherize(delegate.delegate_status)}`}
                key={delegate.id}
              >
                <Table.Cell>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  >
                    <Button
                      href={`mailto:${delegate.email}`}
                      icon="envelope"
                    />
                    {isEditVisible && (
                      <Button
                        href={`users/${delegate.id}/edit`}
                        icon="edit"
                      />
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
