import React, { useMemo } from 'react';
import { Container, Grid, Header } from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import I18n from '../../lib/i18n';
import UserBadge from '../UserBadge';

export default function Translators() {
  const {
    data: translators, loading, error,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroupType(groupTypes.translators));
  const groupedTranslators = useMemo(
    () => Object.groupBy(translators || [], (role) => role.group.id),
    [translators],
  );
  const translatorGroups = useMemo(
    () => Object.keys(groupedTranslators).map((key) => groupedTranslators[key][0].group),
    [groupedTranslators],
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <Container fluid>
      <Header as="h2">{I18n.t('page.translators.title')}</Header>
      {translatorGroups.map((group) => (
        <>
          <Header as="h3" key={group.id}>{group.name}</Header>
          <Grid padded>
            {groupedTranslators[group.id].map((role) => (
              <Grid.Column key={role.id} width={4}>
                <UserBadge user={role.user} />
              </Grid.Column>
            ))}
          </Grid>
        </>
      ))}
    </Container>
  );
}
