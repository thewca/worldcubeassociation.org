import React from 'react';

import {
  Button,
  Checkbox,
  Dropdown,
  Grid,
  Header,
  Label,
  Menu,
  Segment,
  Table,
} from 'semantic-ui-react';
import cn from 'classnames';
import _ from 'lodash';
import I18n from '../../lib/i18n';
import UserBadge from '../UserBadge';

import { delegatesStaticPageDataUrl } from '../../lib/requests/routes.js.erb';
import '../../stylesheets/delegates/style.scss';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';

// let i18n-tasks know the key is used
// i18n-tasks-use t('delegates_page.acknowledges')

const dasherize = (string) => _.kebabCase(string);
// In the current status quo, we have no standardized list of Senior regions.
// We use the Senior's location, which has the format "Region (actual Location)" to guess the region
const seniorLocationToRegion = (string) => string.split('(')[0].trim();

function sortedDelegates(delegates) {
  return delegates.sort((user1, user2) => (user1.location !== user2.location
    ? user1.location.localeCompare(user2.location)
    : user1.name.localeCompare(user2.name)));
}

function DelegatesOfRegion({ activeSeniorDelegate, delegates, isAdminMode }) {
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
          activeSeniorDelegate,
          ...delegates.filter(
            (user) => user.senior_delegate_id === activeSeniorDelegate.id
              && (user.delegate_status !== 'trainee_delegate' || isAdminMode),
          ),
        ]).map((delegate) => (
          <Table.Row
            className={cn(`${dasherize(delegate.delegate_status)}`)}
            key={delegate.id}
          >
            <Table.Cell verticalAlign="middle">
              <Button.Group vertical>
                <Button href={`mailto:${delegate.email}`} icon="envelope" />
                {isAdminMode && (
                  <Button href={`users/${delegate.id}/edit`} icon="edit" />
                )}
              </Button.Group>
            </Table.Cell>
            <Table.Cell>
              <UserBadge
                user={delegate}
                hideBorder
                leftAlign
                subtexts={delegate.wca_id ? [delegate.wca_id] : []}
              />
            </Table.Cell>
            <Table.Cell>
              {I18n.t(`enums.user.delegate_status.${delegate.delegate_status}`)}
            </Table.Cell>
            <Table.Cell>{delegate.location}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export default function Delegates() {
  const { data, loading, error } = useLoadedData(delegatesStaticPageDataUrl);

  const { delegates, canViewDelegateMatters } = data || {};
  const seniorDelegates = React.useMemo(
    () => !!delegates
      && delegates
        .filter((user) => user.delegate_status === 'senior_delegate')
        .sort((user1, user2) => (user1.location || '').localeCompare(user2.location || '')),
    [delegates],
  );

  const [activeSeniorDelegate, setActiveSeniorDelegate] = React.useState();
  const [adminMode, setAdminMode] = React.useState(false);

  React.useEffect(() => {
    setActiveSeniorDelegate(seniorDelegates?.[0]);
  }, [seniorDelegates]);

  // NOTE: The UI currently assumes that the delegates always have a
  // senior delegate unless they themselves are a senior delegate.

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <div className="container">
      <Header as="h1">{I18n.t('delegates_page.title')}</Header>
      <p>
        <I18nHTMLTranslate
          i18nKey="about.structure.delegates_html"
          options={{ see_link: '' }}
        />
      </p>
      <p>
        <I18nHTMLTranslate i18nKey="delegates_page.acknowledges" />
      </p>
      {canViewDelegateMatters && (
        <Checkbox
          label="Enable admin mode"
          toggle
          checked={adminMode}
          onChange={(__, { checked }) => setAdminMode(checked)}
        />
      )}
      <Grid container>
        <Grid.Column only="computer" computer={4}>
          <Header>{I18n.t('delegates_page.regions')}</Header>
          <Menu vertical>
            {seniorDelegates.map((seniorDelegate) => (
              <Menu.Item
                key={`region-${seniorDelegate.id}`}
                name={seniorLocationToRegion(seniorDelegate.location || '')}
                active={activeSeniorDelegate === seniorDelegate}
                onClick={() => setActiveSeniorDelegate(seniorDelegate)}
              >
                {/* The 'name' shorthand above can populate the
                label, but it sanitizes & signs :( */}
                {seniorLocationToRegion(seniorDelegate.location || '')}
              </Menu.Item>
            ))}
          </Menu>
        </Grid.Column>

        <Grid.Column stretched computer={12} mobile={16} tablet={16}>
          <Segment>
            <Grid container centered>
              <Grid.Row only="computer">
                <Header>
                  {seniorLocationToRegion(activeSeniorDelegate.location || '')}
                </Header>
              </Grid.Row>
              <Grid.Row only="tablet mobile">
                <Dropdown
                  inline
                  options={seniorDelegates.map((seniorDelegate) => ({
                    key: `senior-delegate-${seniorDelegate.id}`,
                    text: seniorLocationToRegion(seniorDelegate.location || ''),
                    value: seniorDelegate.id,
                  }))}
                  value={activeSeniorDelegate.id}
                  onChange={(event, { value }) => {
                    setActiveSeniorDelegate(
                      seniorDelegates.find(
                        (seniorDelegate) => seniorDelegate.id === value,
                      ),
                    );
                  }}
                />
              </Grid.Row>
              {/* TODO: Fix Senior Delegate ribbon CSS for tablet and mobile view,
            and enable this component for all devices */}
              <Grid.Row only="computer">
                <Segment raised>
                  <Label ribbon>
                    {I18n.t('enums.user.delegate_status.senior_delegate')}
                  </Label>

                  <UserBadge
                    user={activeSeniorDelegate}
                    hideBorder
                    leftAlign
                    subtexts={
                      activeSeniorDelegate.wca_id
                        ? [activeSeniorDelegate.wca_id]
                        : []
                    }
                  />
                </Segment>
              </Grid.Row>
              <Grid.Row style={{ overflowX: 'scroll' }}>
                <DelegatesOfRegion
                  activeSeniorDelegate={activeSeniorDelegate}
                  delegates={delegates}
                  isAdminMode={adminMode}
                />
              </Grid.Row>
            </Grid>
          </Segment>
        </Grid.Column>
      </Grid>
    </div>
  );
}
