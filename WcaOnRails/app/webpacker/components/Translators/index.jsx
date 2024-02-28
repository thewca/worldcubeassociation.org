import React, { Fragment, useMemo } from 'react';
import { Container, Grid, Header } from 'semantic-ui-react';
import _ from 'lodash';
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
    () => _.groupBy((translators || []), (role) => role.group.id),
    [translators],
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <Container fluid>
      <Header as="h2">{I18n.t('page.translators.title')}</Header>
      {Object.keys(groupedTranslators).map((groupId) => (
        <Fragment key={groupId}>
          <Header as="h3">{groupedTranslators[groupId][0].group.name}</Header>
          <Grid padded>
            {groupedTranslators[groupId].map((role) => (
              <Grid.Column
                key={role.id}
                style={{ width: 'fit-content' }}
              >
                <UserBadge user={role.user} />
              </Grid.Column>
            ))}
          </Grid>
        </Fragment>
      ))}
    </Container>
  );
}
