import React, { useMemo } from 'react';
import { Button, Icon, Table } from 'semantic-ui-react';
import _ from 'lodash';
import cn from 'classnames';
import { useSort, compareColumns } from './useSort';
import I18n from '../../lib/i18n';
import { competitionsUrl } from '../../lib/requests/routes.js.erb';
import UserBadge from '../UserBadge';

const dasherize = (string) => _.kebabCase(string);

const COLUMN_TO_FIELD_PATH = {
  name: 'user.name',
  role: 'metadata.status',
  region: 'metadata.location',
  first_delegated: 'metadata.first_delegated',
  last_delegated: 'metadata.last_delegated',
  date_since_last_delegated: 'metadata.date_since_last_delegated',
  total_delegated: 'metadata.total_delegated',
};

function SortingIndicator({ sortingState, column }) {
  return (
    <Icon
      className={`sorting-indicator ${(sortingState.column === column ? '' : ' sorting-indicator_hidden')}`}
      name={sortingState.direction === 'ascending' ? 'chevron up' : 'chevron down'}
    />
  );
}

function DelegatesTableHeaderCell({
  handleSortingChange, column, title, sortingState, isSortingEnabled,
}) {
  return (
    <Table.HeaderCell onClick={() => handleSortingChange(column)} className={isSortingEnabled ? 'sortable-column-header-cell' : null}>
      {title ?? I18n.t(`delegates_page.table.${column}`)}
      {isSortingEnabled
        && (
          <SortingIndicator
            sortingState={sortingState}
            handleSortingChange={handleSortingChange}
            column={column}
          />
        )}
    </Table.HeaderCell>
  );
}

export default function DelegatesTable({
  delegates: allPassedDelegates, isAdminMode, isAllLeadDelegates, isAllNonLeadDelegates,
}) {
  const isSortingEnabled = isAllNonLeadDelegates;
  const { sortingState, handleSortingChange } = useSort({ column: 'name', direction: 'descending' }, ['name', 'role', 'region', 'first_delegated', 'last_delegated', 'date_since_last_delegated', 'total_delegated']);

  const tableData = useMemo(() => {
    /** @type {Array} */
    const delegates = isAdminMode ? allPassedDelegates : allPassedDelegates.filter((delegate) => delegate.metadata.status !== 'trainee_delegate');
    if (!isSortingEnabled) return delegates;

    return delegates.toSorted(
      (delegateA, delegateB) => {
        const columnValueA = _.get(delegateA, COLUMN_TO_FIELD_PATH[sortingState.column]);
        const columnValueB = _.get(delegateB, COLUMN_TO_FIELD_PATH[sortingState.column]);

        const comparatorResult = compareColumns(columnValueA, columnValueB);
        return sortingState.direction === 'ascending' ? comparatorResult : -comparatorResult;
      },
    );
  }, [allPassedDelegates, isAdminMode, isSortingEnabled, sortingState]);

  return (
    <div style={{ overflowX: 'scroll' }}>
      <Table unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell collapsing />

            <DelegatesTableHeaderCell column="name" isSortingEnabled={isSortingEnabled} sortingState={sortingState} handleSortingChange={handleSortingChange} />
            <DelegatesTableHeaderCell column="role" isSortingEnabled={isSortingEnabled} sortingState={sortingState} handleSortingChange={handleSortingChange} />

            {!isAllLeadDelegates && (
              <DelegatesTableHeaderCell column="region" languageKey="delegates_page.table.region" isSortingEnabled={isSortingEnabled} sortingState={sortingState} handleSortingChange={handleSortingChange} />
            )}

            {isAllNonLeadDelegates && (
              <>
                <DelegatesTableHeaderCell column="first_delegated" isSortingEnabled={isSortingEnabled} sortingState={sortingState} handleSortingChange={handleSortingChange} />
                <DelegatesTableHeaderCell column="last_delegated" isSortingEnabled={isSortingEnabled} sortingState={sortingState} handleSortingChange={handleSortingChange} />
                <DelegatesTableHeaderCell
                  column="date_since_last_delegated"
                  title={
                    /* NOTE: No i18n because this is only visible to admins */
                    'Date Since Last Delegated'
                  }
                  isSortingEnabled={isSortingEnabled}
                  sortingState={sortingState}
                  handleSortingChange={handleSortingChange}
                />
                <DelegatesTableHeaderCell column="total_delegated" isSortingEnabled={isSortingEnabled} sortingState={sortingState} handleSortingChange={handleSortingChange} />
              </>
            )}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {tableData.map((delegate) => (
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
                {I18n.t(`enums.user_roles.status.delegate_regions.${delegate.metadata.status}`)}
              </Table.Cell>
              {!isAllLeadDelegates && (<Table.Cell>{delegate.metadata.location}</Table.Cell>)}
              {isSortingEnabled && (
                <>
                  <Table.Cell>{delegate.metadata.first_delegated}</Table.Cell>
                  <Table.Cell>{delegate.metadata.last_delegated}</Table.Cell>
                  <Table.Cell>{delegate.date_since_last_delegated}</Table.Cell>
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
    </div>
  );
}
