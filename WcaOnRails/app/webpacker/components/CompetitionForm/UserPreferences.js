import {
  Checkbox,
  Dimmer,
  Header,
  List,
  Segment,
} from 'semantic-ui-react';
import React, { useMemo } from 'react';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  competitionUserPreferencesUrl,
  updateUserNotificationsUrl,
} from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import useSaveAction from '../../lib/hooks/useSaveAction';

function NotificationSettingsAction({
  competitionId,
  data,
  sync,
}) {
  const { isReceivingNotifications } = data;

  const { save, saving } = useSaveAction();

  const saveNotificationPreference = (_, { checked: receiveNotifications }) => {
    save(updateUserNotificationsUrl(competitionId), {
      receive_registration_emails: receiveNotifications,
    }, sync);
  };

  return (
    <List.Item>
      <Checkbox
        checked={isReceivingNotifications}
        onChange={saveNotificationPreference}
        disabled={saving}
        label={I18n.t('competitions.receive_registration_emails')}
      />
    </List.Item>
  );
}

export default function UserPreferences({ disabled = false }) {
  const { initialCompetition: { competitionId } } = useStore();

  const dataUrl = useMemo(() => competitionUserPreferencesUrl(competitionId), [competitionId]);

  const {
    data,
    loading,
    sync,
  } = useLoadedData(dataUrl);

  if (loading) return <Loading />;

  return (
    <Dimmer.Dimmable as={Segment} blurring dimmed={disabled}>
      <Dimmer active={disabled}>
        You have unsaved changes. Please save the competition before taking any other action.
      </Dimmer>

      <Header style={{ marginTop: 0 }}>{I18n.t('competitions.user_preferences')}</Header>
      <List verticalAlign="middle">
        <NotificationSettingsAction competitionId={competitionId} data={data} sync={sync} />
      </List>
    </Dimmer.Dimmable>
  );
}
