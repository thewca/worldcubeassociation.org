import { Button } from 'semantic-ui-react';
import React, { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';
import {
  competitionUrl,
  confirmCompetitionUrl,
  homepageUrl,
} from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import ConfirmProvider, { useConfirm } from '../../lib/providers/ConfirmProvider';
import { useFormErrorHandler, useFormInitialObject } from '../wca/FormBuilder/provider/FormObjectProvider';
import { confirmationDataQueryKey, useConfirmationData } from './api';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

function ConfirmButton({
  competitionId,
  confirmationData,
}) {
  const { canConfirm } = confirmationData;

  const onError = useFormErrorHandler();

  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (compId) => fetchJsonOrError(confirmCompetitionUrl(compId), {
      method: 'PUT',
    }),
    onSuccess: (respData, compId) => queryClient.setQueryData(
      confirmationDataQueryKey(compId),
      respData,
    ),
    onError,
  });

  const confirmCompetition = useCallback(() => {
    confirm({
      content: I18n.t('competitions.competition_form.submit_confirm'),
    }).then(() => mutation.mutate(competitionId));
  }, [competitionId, confirm, mutation]);

  if (!canConfirm) return null;

  return (
    <Button
      positive
      onClick={confirmCompetition}
      disabled={mutation.isPending}
    >
      {I18n.t('competitions.competition_form.submit_confirm_value')}
    </Button>
  );
}

function DeleteButton({
  competitionId,
  confirmationData,
}) {
  const { cannotDeleteReason } = confirmationData;

  const confirm = useConfirm();

  const mutation = useMutation({
    mutationFn: (compId) => fetchJsonOrError(competitionUrl(compId), {
      method: 'DELETE',
    }),
    onSuccess: () => window.location.replace(homepageUrl),
  });

  const deleteCompetition = useCallback(() => {
    confirm({
      content: I18n.t('competitions.competition_form.submit_delete'),
    }).then(() => mutation.mutate(competitionId));
  }, [competitionId, confirm, mutation]);

  if (cannotDeleteReason) return null;

  return (
    <Button
      negative
      onClick={deleteCompetition}
    >
      {I18n.t('competitions.competition_form.submit_delete_value')}
    </Button>
  );
}

export default function Footer() {
  const { isAdminView } = useStore();
  const { competitionId } = useFormInitialObject();

  const {
    data: confirmationData,
    loading,
  } = useConfirmationData(competitionId);

  if (loading) return <Loading />;

  const { isConfirmed } = confirmationData;

  return (
    <ConfirmProvider>
      <Button.Group>
        {!isAdminView && !isConfirmed && (
          <ConfirmButton competitionId={competitionId} confirmationData={confirmationData} />
        )}
        {!isConfirmed && (
          <DeleteButton competitionId={competitionId} confirmationData={confirmationData} />
        )}
      </Button.Group>
    </ConfirmProvider>
  );
}
