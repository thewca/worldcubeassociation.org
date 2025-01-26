import {
  Checkbox,
  Dimmer,
  Header,
  List,
  Segment,
} from 'semantic-ui-react';
import React, { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import { updateUserNotificationsUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import { useFormContext } from '../wca/FormBuilder/provider/FormObjectProvider';
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
    }),
    onSuccess: (_, variables) => queryClient.setQueryData(
      userPreferencesQueryKey(variables.competitionId),
      (oldData) => ({ ...oldData, isReceivingNotifications: variables.receiveNotifications }),
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
  const { unsavedChanges } = useFormContext();

  const {
    data: userPreferences,
    isLoading,
  } = useUserPreferences(competitionId);

  if (isLoading) return <Loading />;

  return (
    <Dimmer.Dimmable as={Segment} blurring dimmed={unsavedChanges}>
      <Dimmer active={unsavedChanges}>
        You have unsaved changes. Please save the competition before taking any other action.
      </Dimmer>

      <Header style={{ marginTop: 0 }}>{I18n.t('competitions.user_preferences')}</Header>
      <List verticalAlign="middle">
        <NotificationSettingsAction
          competitionId={competitionId}
          userPreferences={userPreferences}
        />
      </List>
    </Dimmer.Dimmable>
  );
}
