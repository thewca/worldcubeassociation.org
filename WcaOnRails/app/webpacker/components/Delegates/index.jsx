import React from 'react';

import {
  Button,
  Dropdown,
  Grid,
  Header,
  Label,
  Menu,
  Segment,
  Table,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import UserBadge from '../UserBadge';

import '../../stylesheets/delegates/style.scss';

const dasherize = (string) => string.replace(/_/g, '-');

function sortedDelegates(delegates) {
  return delegates.sort((user1, user2) => ((user1.location !== user2.location)
    ? user1.location.localeCompare(user2.location)
    : user1.name.localeCompare(user2.name)));
}

function DelegatesOfRegion({ activeSeniorDelegate, delegates, isAdminMode }) {
  return (
    <Table className="delegates-table" unstackable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{I18n.t('delegates_page.table.name')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('delegates_page.table.role')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('delegates_page.table.region')}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {[
          ...sortedDelegates([
            activeSeniorDelegate,
            ...delegates.filter(
              (user) => user.senior_delegate_id === activeSeniorDelegate.id && user.delegate_status !== 'trainee_delegate',
            )]),
        ].map((delegate) => (
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
                {isAdminMode && (
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
              {delegate.location}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export default function Delegates({
  delegates,
  isEditVisible,
}) {
  const seniorDelegates = React.useMemo(() => delegates
    .filter((user) => user.delegate_status === 'senior_delegate')
    .sort((user1, user2) => (user1.location || '').localeCompare(user2.location || '')), [delegates]);
  const [activeSeniorDelegate, setActiveSeniorDelegate] = React.useState(
    seniorDelegates.length ? seniorDelegates[0] : null,
  );

  // NOTE: The UI currently assumes that the delegates always have a
  // senior delegate unless they themselves are a senior delegate.

  return (
    <Grid container>
      <Grid.Column only="computer" computer={4}>
        <Header>Regions</Header>
        <Menu vertical>
          {seniorDelegates.map((seniorDelegate) => (
            <Menu.Item
              key={`region-${seniorDelegate.id}`}
              name={(seniorDelegate.location || '').split('(')[0].trim()}
              active={activeSeniorDelegate === seniorDelegate}
              onClick={() => {
                setActiveSeniorDelegate(seniorDelegate);
              }}
            />
          ))}
        </Menu>
      </Grid.Column>

      <Grid.Column stretched computer={12} mobile={16} tablet={16}>
        <Segment>
          <Grid container centered>
            <Grid.Row only="computer">
              <Header>{(activeSeniorDelegate.location || '').split('(')[0].trim()}</Header>
            </Grid.Row>
            <Grid.Row only="computer">
              <Segment raised>
                <Label ribbon>Senior Delegate</Label>

                <UserBadge
                  user={activeSeniorDelegate}
                  hideBorder
                  leftAlign
                  subtexts={activeSeniorDelegate.wca_id ? [activeSeniorDelegate.wca_id] : []}
                />
              </Segment>
            </Grid.Row>
            <Grid.Row only="tablet mobile">
              <Dropdown
                inline
                options={seniorDelegates.map((seniorDelegate) => ({
                  key: `senior-delegate-${seniorDelegate.id}`,
                  text: (seniorDelegate.location || '').split('(')[0].trim(),
                  value: seniorDelegate.id,
                }))}
                value={activeSeniorDelegate.id}
                onChange={(event, { value }) => {
                  setActiveSeniorDelegate(
                    seniorDelegates.find((seniorDelegate) => seniorDelegate.id === value),
                  );
                }}
              />
            </Grid.Row>
            <Grid.Row style={{ overflowX: 'scroll' }}>
              <DelegatesOfRegion
                activeSeniorDelegate={activeSeniorDelegate}
                delegates={delegates}
                isAdminMode={isEditVisible}
              />
            </Grid.Row>
          </Grid>
        </Segment>
      </Grid.Column>
    </Grid>
  );
}
