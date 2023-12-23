import React from 'react';

import {
  Checkbox,
  Dropdown,
  Grid,
  Header,
  Menu,
  Segment,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';

import { fetchUserGroupsUrl } from '../../lib/requests/routes.js.erb';
import '../../stylesheets/delegates/style.scss';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';
import { groupTypes } from '../../lib/wca-data.js.erb';
import DelegatesOfRegion from './DelegatesOfRegion';
import useHash from '../../lib/hooks/useHash';

// let i18n-tasks know the key is used
// i18n-tasks-use t('delegates_page.acknowledges')

export default function Delegates() {
  const { loggedInUserPermissions, loading: permissionsLoading } = useLoggedInUserPermissions();
  const {
    data: delegateGroups,
    loading: delegateGroupsLoading,
    error: delegateGroupsError,
  } = useLoadedData(fetchUserGroupsUrl(groupTypes.delegate_regions));
  const delegateRegions = React.useMemo(
    () => delegateGroups?.filter((group) => group.parent_group_id === null) || [],
    [delegateGroups],
  );

  const [hash, setHash] = useHash();

  const activeRegion = React.useMemo(() => {
    const selectedRegionIndex = delegateRegions.findIndex((region) => region.id === +hash);
    if (selectedRegionIndex === -1 && delegateRegions.length > 0) {
      setHash(delegateRegions[0]?.id);
      return null;
    }
    return delegateRegions[selectedRegionIndex];
  }, [delegateRegions, hash, setHash]);

  const [adminMode, setAdminMode] = React.useState(false);

  if (permissionsLoading || delegateGroupsLoading || !activeRegion) return <Loading />;
  if (delegateGroupsError) return <Errored />;

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
      {loggedInUserPermissions.canViewDelegateAdminPage() && (
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
            {delegateRegions.map((region) => (
              <Menu.Item
                key={region.id}
                name={region.name}
                active={region.id === hash}
                onClick={() => setHash(region.id)}
              />
            ))}
          </Menu>
        </Grid.Column>

        <Grid.Column stretched computer={12} mobile={16} tablet={16}>
          <Segment>
            <Grid container centered>
              <Grid.Row only="computer">
                <Header>{activeRegion.name}</Header>
              </Grid.Row>
              <Grid.Row only="tablet mobile">
                <Dropdown
                  inline
                  options={delegateRegions.map((region) => ({
                    key: region.id,
                    text: region.name,
                    value: region.id,
                  }))}
                  value={hash}
                  onChange={(__, { value }) => setHash(value)}
                />
              </Grid.Row>
              <DelegatesOfRegion
                activeRegion={activeRegion}
                isAdminMode={adminMode}
              />
            </Grid>
          </Segment>
        </Grid.Column>
      </Grid>
    </div>
  );
}
