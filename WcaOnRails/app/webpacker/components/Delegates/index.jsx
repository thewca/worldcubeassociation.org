import React, { useState } from 'react';

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
import DelegatesOfRegion, { ALL_REGIONS } from './DelegatesOfRegion';
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
  const delegateSubregions = React.useMemo(
    () => delegateGroups?.reduce((_delegateSubregions, group) => {
      if (group.parent_group_id) {
        const parentGroup = delegateGroups.find(
          (parent) => parent.id === group.parent_group_id,
        );
        if (parentGroup) {
          const updatedSubregions = { ..._delegateSubregions };
          updatedSubregions[parentGroup.id] = updatedSubregions[parentGroup.id] || [];
          updatedSubregions[parentGroup.id].push(group);
          return updatedSubregions;
        }
      }
      return _delegateSubregions;
    }, {}),
    [delegateGroups],
  );

  const [hash, setHash] = useHash();

  const activeRegion = React.useMemo(() => {
    if (hash === ALL_REGIONS.id) return ALL_REGIONS;
    const selectedRegionIndex = delegateRegions.findIndex(
      (region) => region.metadata.friendly_id === hash,
    );
    if (selectedRegionIndex === -1 && delegateRegions.length > 0) {
      setHash(delegateRegions[0]?.metadata.friendly_id);
      return null;
    }
    return delegateRegions[selectedRegionIndex];
  }, [delegateRegions, hash, setHash]);

  const [toggleAdmin, setToggleAdmin] = useState(false);
  const isAdminMode = toggleAdmin || (
    activeRegion === ALL_REGIONS && loggedInUserPermissions.canViewDelegateAdminPage
  );

  if (permissionsLoading || delegateGroupsLoading || !activeRegion) return <Loading />;
  if (delegateGroupsError) return <Errored />;
  if (activeRegion === ALL_REGIONS && !isAdminMode) {
    if (loggedInUserPermissions.canViewDelegateAdminPage) {
      return <Loading />;
    }
    return <Errored />;
  }

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
      {loggedInUserPermissions.canViewDelegateAdminPage && (
        <Checkbox
          label="Enable admin mode"
          toggle
          checked={isAdminMode}
          onChange={(__, { checked }) => setToggleAdmin(checked)}
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
                active={region.metadata.friendly_id === hash}
                onClick={() => setHash(region.metadata.friendly_id)}
              />
            ))}
            {isAdminMode && (
              <Menu.Item
                key={ALL_REGIONS.id}
                name={ALL_REGIONS.name}
                active={activeRegion === ALL_REGIONS}
                onClick={() => setHash(ALL_REGIONS.id)}
              />
            )}
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
                    value: region.metadata.friendly_id,
                  }))}
                  value={hash}
                  onChange={(__, { value }) => setHash(value)}
                />
              </Grid.Row>
              <DelegatesOfRegion
                activeRegion={activeRegion}
                delegateSubregions={delegateSubregions[activeRegion.id] || []}
                isAdminMode={isAdminMode}
              />
            </Grid>
          </Segment>
        </Grid.Column>
      </Grid>
    </div>
  );
}
