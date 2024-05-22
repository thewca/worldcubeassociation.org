import React from 'react';
import { Button, Header, Message } from 'semantic-ui-react';
import EmailButton from '../EmailButton';
import { apiV0Urls, contactRecipientUrl } from '../../lib/requests/routes.js.erb';
import I18n from '../../lib/i18n';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import RolesTable from './RolesTable';

export default function GroupPage({ group, canViewPastRoles }) {
  const {
    data: activeRoles,
    loading: activeRolesLoading,
    error: activeRolesError,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroup(group.id, 'status:desc,name', { isActive: true }));
  const {
    data: pastRoles,
    loading: pastRolesLoading,
    error: pastRolesError,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroup(group.id, 'status:desc,name', { isActive: false }));

  if (activeRolesLoading || pastRolesLoading) return <Loading />;
  if (activeRolesError || pastRolesError) return <Errored />;

  return (
    <>
      <p>{I18n.t(`page.teams_committees_councils.groups_description.${group.metadata.friendly_id}`)}</p>
      {
        (
          !group.metadata.preferred_contact_mode || group.metadata.preferred_contact_mode === 'email'
        ) && <EmailButton email={group.metadata.email} />
      }
      {
        group.metadata.preferred_contact_mode === 'contact_form'
          && (
          <Button href={contactRecipientUrl(group.metadata.friendly_id)}>
            {I18n.t('page.teams_committees_councils.contact_button')}
          </Button>
          )
      }
      {
        group.metadata.preferred_contact_mode === 'no_contact'
          && <Message>{I18n.t('page.teams_committees_councils.no_contact_description')}</Message>
      }
      <RolesTable roleList={activeRoles} />
      {canViewPastRoles && (
        <>
          <Header>Past Roles</Header>
          <RolesTable roleList={pastRoles} />
        </>
      )}
    </>
  );
}
