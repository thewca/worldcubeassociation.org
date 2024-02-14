import React from 'react';
import { Button, Table } from 'semantic-ui-react';
import _ from 'lodash';
import cn from 'classnames';
import { DateTime } from 'luxon';
import I18n from '../../lib/i18n';
import { competitionsUrl } from '../../lib/requests/routes.js.erb';
import UserBadge from '../UserBadge';

const dasherize = (string) => _.kebabCase(string);

const dateSince = (date) => {
  if (!date) {
    return null;
  }
  const now = DateTime.local();
  const then = DateTime.fromISO(date);
  const diff = now.diff(then, ['years', 'months', 'days']);
  return Math.floor(diff.as('days'));
};

export default function DelegatesTable({ delegates, isAdminMode, isAllRegions }) {
  return (
    <Table className="delegates-table" unstackable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell collapsing />
          <Table.HeaderCell>
            {I18n.t('delegates_page.table.name')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('delegates_page.table.role')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('delegates_page.table.region')}
          </Table.HeaderCell>
          {isAllRegions && (
            <>
              <Table.HeaderCell>
                {I18n.t('delegates_page.table.first_delegated')}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {I18n.t('delegates_page.table.last_delegated')}
              </Table.HeaderCell>
              <Table.HeaderCell>
                Date Since Last Delegated
                {/* No i18n because this is only visible to admins */}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {I18n.t('delegates_page.table.total_delegated')}
              </Table.HeaderCell>
              <Table.HeaderCell />
            </>
          )}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {delegates
          .filter((delegate) => delegate.metadata.status !== 'trainee_delegate' || isAdminMode)
          .map((delegate) => (
            <Table.Row
              className={cn(`${dasherize(delegate.metadata.status)}`)}
              key={delegate.user.id}
            >
              <Table.Cell verticalAlign="middle">
                <Button.Group vertical>
                  <Button href={`mailto:${delegate.user.email}`} icon="envelope" />
                  {isAdminMode && (
                  <Button href={`users/${delegate.user.id}/edit`} icon="edit" />
                  )}
                </Button.Group>
              </Table.Cell>
              <Table.Cell>
                <UserBadge
                  user={delegate.user}
                  hideBorder
                  leftAlign
                  subtexts={delegate.user.wca_id ? [delegate.user.wca_id] : []}
                />
              </Table.Cell>
              <Table.Cell>
                {I18n.t(`enums.user.role_status.delegate_regions.${delegate.metadata.status}`)}
              </Table.Cell>
              <Table.Cell>{delegate.metadata.location}</Table.Cell>
              {isAllRegions && (
                <>
                  <Table.Cell>{delegate.metadata.first_delegated}</Table.Cell>
                  <Table.Cell>{delegate.metadata.last_delegated}</Table.Cell>
                  <Table.Cell>{dateSince(delegate.metadata.last_delegated)}</Table.Cell>
                  <Table.Cell>{delegate.metadata.total_delegated}</Table.Cell>
                  <Table.Cell href={competitionsUrl({
                    display: 'admin',
                    years: 'all',
                    delegate: delegate.user.id,
                  })}
                  >
                    {I18n.t('delegates_page.table.history')}
                  </Table.Cell>
                </>
              )}
            </Table.Row>
          ))}
      </Table.Body>
    </Table>
  );
}
