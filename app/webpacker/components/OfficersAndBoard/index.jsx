import React, { useMemo, useState } from 'react';
import {
  Button, Container, Header, Icon, Popup,
} from 'semantic-ui-react';
import _ from 'lodash';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import UserBadge from '../UserBadge';
import EmailButton from '../EmailButton';

// let i18n-tasks know the key is used
// i18n-tasks-use t('user_roles.status.officers.chair')
// i18n-tasks-use t('user_roles.status.officers.executive_director')
// i18n-tasks-use t('user_roles.status.officers.secretary')
// i18n-tasks-use t('user_roles.status.officers.vice_chair')
// i18n-tasks-use t('user_roles.status.officers.treasurer')

export default function OfficersAndBoard({ boardEmail }) {
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
  const [hoveringEmail, setHoveringEmail] = useState(false);

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
            (officerRole) => I18n.t(`user_roles.status.officers.${officerRole.metadata.status}`),
          )}
        />
      ))}
      <Header as="h3">
        <span>{I18n.t('user_groups.group_types.board')}</span>
        <EmailButton email={boardEmail} />
        <Popup
          content="Copy to Clipboard"
          trigger={(
            <Button
              onClick={() => navigator.clipboard.writeText(boardEmail)}
              icon
              style={{
                margin: '8px',
              }}
              onMouseEnter={() => setHoveringEmail(true)}
              onMouseLeave={() => setHoveringEmail(false)}
            >
              <Icon name={hoveringEmail ? 'copy' : 'mail'} />
              {hoveringEmail && (
                <span>{boardEmail}</span>
              )}
            </Button>
          )}
        />
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
