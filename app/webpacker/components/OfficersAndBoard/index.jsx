import React, { useMemo } from 'react';
import { Container, Header } from 'semantic-ui-react';
import _ from 'lodash';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import UserBadge from '../UserBadge';
import EmailButton from '../EmailButton';

export default function OfficersAndBoard() {
  const { data: officers, loading: officersLoading, error: officersError } = useLoadedData(
    apiV0Urls.userRoles.listOfGroupType(groupTypes.officers, 'status', {
      isActive: true,
    }),
  );
  const { data: board, loading: boardLoading, error: boardError } = useLoadedData(
    apiV0Urls.userRoles.listOfGroupType(groupTypes.board, 'name', {
      isActive: true,
    }),
  );

  // The same user can hold multiple officer positions, and it won't be good to show same user
  // multiple times.
  const officerRoles = useMemo(() => _.groupBy(officers, (officer) => officer.user.id), [officers]);
  const officerUserIds = useMemo(() => _.uniq(
    officers?.map((officer) => officer.user.id),
  ), [officers]);

  if (boardLoading || officersLoading) return <Loading />;
  if (boardError || officersError) return <Errored />;

  return (
    <Container fluid>
      <Header as="h2">{I18n.t('page.officers_and_board.title')}</Header>
      <Header as="h3">{I18n.t('user_groups.group_types.officers')}</Header>
      <p>{I18n.t('page.officers_and_board.officers_description')}</p>
      {officerUserIds.map((officerUserId) => (
        <UserBadge
          key={officerUserId}
          user={officerRoles[officerUserId][0].user}
          size="large"
          subtexts={officerRoles[officerUserId].map(
            (officerRole) => I18n.t(`enums.user_roles.status.officers.${officerRole.metadata.status}`),
          )}
        />
      ))}
      <Header as="h3">
        <span>{I18n.t('user_groups.group_types.board')}</span>
        {' '}
        <EmailButton email={board[0].group.metadata.email} />
      </Header>
      <p>{I18n.t('page.officers_and_board.board_description')}</p>
      {board.map((boardRole) => (
        <UserBadge
          key={boardRole.user.id}
          user={boardRole.user}
          size="large"
        />
      ))}
    </Container>
  );
}
