import React, { useMemo } from 'react';
import {
  Button,
  Grid, Label, Segment, Table,
} from 'semantic-ui-react';
import cn from 'classnames';
import _ from 'lodash';
import I18n from '../../lib/i18n';
import { rolesOfGroup, apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import useLoadedData from '../../lib/hooks/useLoadedData';
import UserBadge from '../UserBadge';

export const ALL_REGIONS = {
  id: 'all',
  name: I18n.t('delegates_page.all_regions'),
};

const dasherize = (string) => _.kebabCase(string);

function sortedDelegates(delegates) {
  return delegates.sort((delegate1, delegate2) => (
    delegate1.metadata.location !== delegate2.metadata.location
      ? delegate1.metadata.location.localeCompare(delegate2.metadata.location)
      : delegate1.user.name.localeCompare(delegate2.user.name)));
}

function SeniorDelegate({ seniorDelegate }) {
  return (
    <>
      <Grid.Row only="computer">
        <Segment raised>
          <Label ribbon>
            {I18n.t('enums.user.delegate_status.senior_delegate')}
          </Label>

          {seniorDelegate && (
            <UserBadge
              user={seniorDelegate.user}
              hideBorder
              leftAlign
              subtexts={seniorDelegate.user.wca_id ? [seniorDelegate.user.wca_id] : []}
            />
          )}
        </Segment>
      </Grid.Row>
      { /* TODO: Fix Senior Delegate ribbon CSS for tablet and mobile view,
           and enable the 'senior delegate' component for all devices */ }
    </>

  );
}

function DelegatesTable({ delegates, isAdminMode }) {
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
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {sortedDelegates([
          ...delegates.filter(
            (delegate) => delegate.metadata.status !== 'trainee_delegate' || isAdminMode,
          ),
        ]).map((delegate) => (
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
              {I18n.t(`enums.user.delegate_status.${delegate.metadata.status}`)}
            </Table.Cell>
            <Table.Cell>{delegate.metadata.location}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export default function DelegatesOfRegion({ activeRegion, isAdminMode }) {
  const isAllRegions = activeRegion.id === ALL_REGIONS.id;
  const { data: delegates, loading, error } = useLoadedData(
    isAllRegions
      ? apiV0Urls.userRoles.listOfGroupType(groupTypes.delegate_regions)
      : rolesOfGroup(activeRegion.id),
  );

  const seniorDelegate = useMemo(
    () => (isAllRegions
      ? null
      : delegates?.find((delegate) => delegate.metadata.status === 'senior_delegate')),
    [delegates, isAllRegions],
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      {!isAllRegions && <SeniorDelegate seniorDelegate={seniorDelegate} />}
      <Grid.Row style={{ overflowX: 'scroll' }}>
        <DelegatesTable
          delegates={delegates}
          isAdminMode={isAdminMode}
        />
      </Grid.Row>
    </>
  );
}
