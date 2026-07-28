import {
  Checkbox,
  Header,
  List,
} from 'semantic-ui-react';
import React, { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import { updateUserNotificationsUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import { userPreferencesQueryKey, useUserPreferences } from './api';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

function NotificationSettingsAction({
  competitionId,
  userPreferences,
}) {
  const { isReceivingNotifications } = userPreferences;

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      compId,
      receiveNotifications,
    }) => fetchJsonOrError(updateUserNotificationsUrl(compId), {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        receive_registration_emails: receiveNotifications,
      }),
    }).then((raw) => raw.data),
    onSuccess: (respData, variables) => queryClient.setQueryData(
      userPreferencesQueryKey(variables.compId),
      respData.data,
    ),
  });

  const saveNotificationPreference = useCallback((_, { checked: receiveNotifications }) => {
    mutation.mutate({ compId: competitionId, receiveNotifications });
  }, [competitionId, mutation]);

  return (
    <List.Item>
      <Checkbox
        checked={isReceivingNotifications}
        onChange={saveNotificationPreference}
        disabled={mutation.isPending}
        label={I18n.t('competitions.receive_registration_emails')}
      />
    </List.Item>
  );
}

export default function UserPreferences({ competitionId }) {
  const {
    data: userPreferences,
    isLoading,
  } = useUserPreferences(competitionId);

  if (isLoading) return <Loading />;

  return (
    <>
      <Header style={{ marginTop: 0 }}>{I18n.t('competitions.user_preferences')}</Header>
      <List verticalAlign="middle">
        <NotificationSettingsAction
          competitionId={competitionId}
          userPreferences={userPreferences}
        />
      </List>
    </>
  );
}
