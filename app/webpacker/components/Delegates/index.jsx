import React, { useMemo, useState } from 'react';

import {
  Checkbox,
  Container,
  Dropdown,
  Grid,
  Header,
  Menu,
  Segment,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';

import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import '../../stylesheets/delegates/style.scss';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';
import { groupTypes } from '../../lib/wca-data.js.erb';
import DelegatesOfRegion, { ALL_REGIONS } from './DelegatesOfRegion';
import useHash from '../../lib/hooks/useHash';
import DelegatesOfAllRegion from './DelegatesOfAllRegion';

// let i18n-tasks know the key is used
// i18n-tasks-use t('delegates_page.acknowledges')

export default function Delegates() {
  const { loggedInUserPermissions, loading: permissionsLoading } = useLoggedInUserPermissions();
  const {
    data: delegateGroups,
    loading: delegateGroupsLoading,
    error: delegateGroupsError,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.delegate_regions, 'name', { isActive: true }));
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
  const isAllRegions = hash === ALL_REGIONS.id;

  const activeRegion = React.useMemo(() => {
    if (isAllRegions) return ALL_REGIONS;
    const selectedRegionIndex = delegateRegions.findIndex(
      (region) => region.metadata.friendly_id === hash,
    );
    if (selectedRegionIndex === -1 && delegateRegions.length > 0) {
      setHash(delegateRegions[0]?.metadata.friendly_id);
      return null;
    }
    return delegateRegions[selectedRegionIndex];
  }, [delegateRegions, hash, isAllRegions, setHash]);

  const [toggleAdmin, setToggleAdmin] = useState(false);
  const isAdminMode = toggleAdmin || (
    activeRegion === ALL_REGIONS && loggedInUserPermissions.canViewDelegateAdminPage
  );
  const menuOptions = useMemo(() => {
    const options = delegateRegions.map((region) => ({
      id: region.id,
      text: region.name,
      friendlyId: region.metadata.friendly_id,
    }));
    if (isAdminMode) {
      options.push({
        id: ALL_REGIONS.id,
        text: ALL_REGIONS.name,
        friendlyId: ALL_REGIONS.id,
      });
    }
    return options;
  }, [delegateRegions, isAdminMode]);

  if (permissionsLoading || delegateGroupsLoading || !activeRegion) return <Loading />;
  if (delegateGroupsError) return <Errored />;
  if (activeRegion === ALL_REGIONS && !isAdminMode) {
    if (loggedInUserPermissions.canViewDelegateAdminPage) {
      return <Loading />;
    }
    return <Errored />;
  }

  return (
    <Container fluid>
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
      <Grid centered>
        <Grid.Row>
          <Grid.Column only="computer" computer={4}>
            <Header>{I18n.t('delegates_page.regions')}</Header>
            <Menu vertical fluid>
              {menuOptions.map((option) => (
                <Menu.Item
                  key={option.id}
                  content={option.text}
                  active={option.friendlyId === hash}
                  onClick={() => setHash(option.friendlyId)}
                />
              ))}
            </Menu>
          </Grid.Column>

          <Grid.Column computer={12} mobile={16} tablet={16}>
            <Segment>
              <Grid centered>
                <Grid.Row only="computer">
                  <Header>{activeRegion.name}</Header>
                </Grid.Row>
                <Grid.Row only="tablet mobile">
                  <Dropdown
                    inline
                    options={menuOptions.map((option) => ({
                      key: option.id,
                      text: option.text,
                      value: option.friendlyId,
                    }))}
                    value={hash}
                    onChange={(__, { value }) => setHash(value)}
                  />
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column>
                    {isAllRegions
                      ? <DelegatesOfAllRegion />
                      : (
                        <DelegatesOfRegion
                          activeRegion={activeRegion}
                          delegateSubregions={delegateSubregions[activeRegion.id] || []}
                          isAdminMode={isAdminMode}
                        />
                      )}
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
}
