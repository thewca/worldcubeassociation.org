import {
  Form,
  Header,
} from 'semantic-ui-react';
import React, { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';
import { useFormErrorHandler } from '../wca/FormBuilder/provider/FormObjectProvider';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import {
  useConfirmationData,
  userPreferencesQueryKey,
} from './api';
import Loading from '../Requests/Loading';
import { updateCompetitionConfirmationDataUrl } from '../../lib/requests/routes.js.erb';

function ConfirmationControlCheckbox({
  competitionId,
  announcementData,
  toggleKey,
}) {
  const { [toggleKey]: isChecked } = announcementData;

  const onError = useFormErrorHandler();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      compId,
      toggleValue,
    }) => fetchJsonOrError(updateCompetitionConfirmationDataUrl(compId), {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        [toggleKey]: toggleValue,
      }),
    }),
    onSuccess: (respData, variables) => queryClient.setQueryData(
      userPreferencesQueryKey(variables.competitionId),
      respData,
    ),
    onError,
  });

  const saveNotificationPreference = useCallback((_, { checked }) => {
    mutation.mutate({ compId: competitionId, toggleValue: checked });
  }, [competitionId, mutation]);

  return (
    <Form.Checkbox
      checked={isChecked}
      onChange={saveNotificationPreference}
      disabled={mutation.isPending}
      label={I18n.t('competitions.receive_registration_emails')}
    />
  );
}

export default function ConfirmationToggles({ competitionId }) {
  const { isAdminView } = useStore();

  const {
    data: announcementData,
    isLoading,
  } = useConfirmationData(competitionId);

  if (!isAdminView) return null;
  if (isLoading) return <Loading />;

  return (
    <>
      <Header style={{ marginTop: 0 }}>{I18n.t('competitions.announcements')}</Header>
      <Form.Group widths="equal">
        <ConfirmationControlCheckbox
          competitionId={competitionId}
          announcementData={announcementData}
          toggleKey="isConfirmed"
        />
        <ConfirmationControlCheckbox
          competitionId={competitionId}
          announcementData={announcementData}
          toggleKey="isVisible"
        />
      </Form.Group>
    </>
  );
}
