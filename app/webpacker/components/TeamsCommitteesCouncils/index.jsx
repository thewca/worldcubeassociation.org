import React, { useMemo } from 'react';
import {
  Container, Dropdown, Grid, Header, Menu, Segment,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import useHash from '../../lib/hooks/useHash';
import GroupPage from './GroupPage';

export default function TeamsCommitteesCouncils({ canViewPastRoles }) {
  const {
    data: teamsCommittees,
    loading: teamsCommitteesLoading,
    error: teamsCommitteesError,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.teams_committees, 'name', { isActive: true, isHidden: false }));

  const {
    data: councils,
    loading: councilsLoading,
    error: councilsError,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.councils, 'name', { isActive: true, isHidden: false }));

  const [hash, setHash] = useHash();
  const loading = teamsCommitteesLoading || councilsLoading;

  const groupList = useMemo(() => (loading ? [] : [
    ...(teamsCommittees || []),
    ...(councils || []),
  ]), [loading, teamsCommittees, councils]);

  const menuOptions = useMemo(() => groupList.map((group) => ({
    id: group.id,
    text: I18n.t(`page.teams_committees_councils.groups_name.${group.metadata.friendly_id}`),
    friendlyId: group.metadata.friendly_id,
  })), [groupList]);

  const activeGroup = React.useMemo(() => {
    const selectedGroupIndex = groupList.findIndex(
      (group) => group.metadata.friendly_id === hash,
    );
    if (selectedGroupIndex === -1 && groupList.length > 0) {
      setHash(groupList[0]?.metadata.friendly_id);
      return null;
    }
    return groupList[selectedGroupIndex];
  }, [groupList, hash, setHash]);

  if (loading || !activeGroup) return <Loading />;
  if (teamsCommitteesError || councilsError) return <Errored />;

  return (
    <Container fluid>
      <Header as="h2">{I18n.t('page.teams_committees_councils.title')}</Header>
      <p>{I18n.t('page.teams_committees_councils.description')}</p>
      <Grid centered>
        <Grid.Row>
          <Grid.Column only="computer" computer={4}>
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
                  <Header>
                    {`${I18n.t(`page.teams_committees_councils.groups_name.${activeGroup.metadata.friendly_id}`)} (${activeGroup.metadata.friendly_id.toUpperCase()})`}
                  </Header>
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
                    scrolling
                    onChange={(__, { value }) => setHash(value)}
                  />
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column>
                    <GroupPage group={activeGroup} canViewPastRoles={canViewPastRoles} />
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
